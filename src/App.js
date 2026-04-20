import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

const API = "https://flight-delay-alert-api.onrender.com";

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

const STATUS_META = {
  ON_TIME:   { label: "On Time",   icon: "●", cls: "s-ontime"    },
  DELAYED:   { label: "Delayed",   icon: "◐", cls: "s-delayed"   },
  CANCELLED: { label: "Cancelled", icon: "✕", cls: "s-cancelled" },
  BOARDING:  { label: "Boarding",  icon: "▶", cls: "s-boarding"  },
  DEPARTED:  { label: "Departed",  icon: "↑", cls: "s-departed"  },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, icon: "●", cls: "" };
  return (
    <span className={`badge ${m.cls}`}>
      <span className="badge-dot">{m.icon}</span>
      {m.label}
    </span>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card" style={{ "--accent": accent }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-bar" />
    </div>
  );
}

function FlightSkeleton() {
  return (
    <div className="flight-card skeleton-card">
      {[80, 120, 60, 60, 90].map((w, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

// Login Modal - pops up only when needed
function LoginModal({ onLogin, onClose, showToast }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      showToast("Please enter username and password", "error"); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        onLogin(data.token);
        showToast("Login successful! Welcome ✈");
        onClose();
      } else {
        showToast("Invalid username or password", "error");
      }
    } catch {
      showToast("Login failed. Try again", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!form.username || !form.password) {
      showToast("Please fill all fields", "error"); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("Registered! Please login now");
        setTab("login");
        setForm({ username: "", password: "" });
      } else {
        showToast("Username already exists", "error");
      }
    } catch {
      showToast("Registration failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="login-header">
          <div style={{ fontSize: "2rem" }}>✈</div>
          <div className="brand-name" style={{ fontSize: "1.5rem" }}>SkyTrack</div>
          <div className="brand-sub">
            {tab === "login" ? "Login to continue" : "Create your account"}
          </div>
        </div>
        <div className="inner-tabs" style={{ marginBottom: "20px" }}>
          <button className={`inner-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}>Login</button>
          <button className={`inner-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}>Register</button>
        </div>
        <div className="form-group">
          <label>Username</label>
          <input value={form.username} placeholder="Enter username"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? handleLogin() : handleRegister())} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} placeholder="Enter password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? handleLogin() : handleRegister())} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }}
          onClick={tab === "login" ? handleLogin : handleRegister}
          disabled={submitting}>
          {submitting ? <span className="spinner" /> : tab === "login" ? "Login" : "Register"}
        </button>
        <p style={{ textAlign: "center", color: "#888", fontSize: "0.78rem", marginTop: "12px" }}>
          Demo: username <b>demo</b> · password <b>demo123</b>
        </p>
      </div>
    </div>
  );
}

function App() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("flights");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("jwt_token") || null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toasts, show: showToast } = useToast();
  const intervalRef = useRef(null);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem("jwt_token", newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("jwt_token");
    showToast("Logged out successfully", "info");
  };

  // Flights are PUBLIC - no login needed
  const fetchFlights = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`${API}/flights`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFlights(data);
      setLastUpdated(new Date());
    } catch {
      if (!silent) showToast("Failed to load flights", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFlights();
    intervalRef.current = setInterval(() => fetchFlights(true), 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchFlights]);

  const tabs = [
    { id: "flights", label: "Flights", icon: "✈" },
    { id: "book",    label: "Book",    icon: "🎫" },
    { id: "alerts",  label: "Alerts",  icon: "🔔" },
    { id: "admin",   label: "Admin",   icon: "⚙" },
  ];

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-brand">
          <div className="brand-icon">✈</div>
          <div>
            <div className="brand-name">SkyTrack</div>
            <div className="brand-sub">Flight Delay Alert System</div>
          </div>
        </div>
        <nav className="tabs">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`tab-btn ${activeTab === t.id ? "active" : ""}`}>
              <span className="tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="navbar-meta">
          {lastUpdated && (
            <span className="last-updated">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button className="refresh-btn" onClick={() => fetchFlights()}>↻</button>
          {token ? (
            <button className="btn btn-logout" onClick={handleLogout}
              style={{ marginLeft: "8px", padding: "6px 14px", fontSize: "0.8rem" }}>
              Logout
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}
              style={{ marginLeft: "8px", padding: "6px 14px", fontSize: "0.8rem" }}>
              Login
            </button>
          )}
        </div>
      </header>

      <main>
        {activeTab === "flights" && (
          <FlightsTab flights={flights} loading={loading} refresh={() => fetchFlights()} showToast={showToast} />
        )}
        {activeTab === "book" && (
          <BookTab flights={flights} showToast={showToast} token={token}
            onLoginRequired={() => setShowLoginModal(true)} />
        )}
        {activeTab === "alerts" && (
          <AlertsTab showToast={showToast} />
        )}
        {activeTab === "admin" && (
          <AdminTab flights={flights} showToast={showToast} token={token}
            refresh={() => fetchFlights()} onLoginRequired={() => setShowLoginModal(true)} />
        )}
      </main>

      {showLoginModal && (
        <LoginModal onLogin={handleLogin} onClose={() => setShowLoginModal(false)} showToast={showToast} />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}

// FLIGHTS TAB - PUBLIC
function FlightsTab({ flights, loading, refresh, showToast }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const stats = {
    total:     flights.length,
    onTime:    flights.filter((f) => f.status === "ON_TIME").length,
    delayed:   flights.filter((f) => f.status === "DELAYED").length,
    cancelled: flights.filter((f) => f.status === "CANCELLED").length,
  };

  const filtered = flights.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      f.flightNumber?.toLowerCase().includes(q) ||
      f.source?.toLowerCase().includes(q) ||
      f.destination?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "ALL" || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="tab-content">
      <div className="stats-row">
        <StatCard label="Total Flights" value={stats.total}     accent="#7c8cf8" />
        <StatCard label="On Time"       value={stats.onTime}    accent="#00d97e" />
        <StatCard label="Delayed"       value={stats.delayed}   accent="#f6a935" />
        <StatCard label="Cancelled"     value={stats.cancelled} accent="#f25c6e" />
      </div>
      <div className="section-header" style={{ marginTop: "32px" }}>
        <h2 className="section-title">
          All Flights <span className="count-chip">{filtered.length}</span>
        </h2>
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input className="search-input" placeholder="Search flights, routes…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All Status</option>
            {Object.keys(STATUS_META).map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flight-grid">
        {loading
          ? Array(6).fill(0).map((_, i) => <FlightSkeleton key={i} />)
          : filtered.length === 0
          ? <div className="empty-state"><div className="empty-icon">✈</div><div>No flights found</div></div>
          : filtered.map((f) => <FlightCard key={f.id} flight={f} />)
        }
      </div>
    </div>
  );
}

function FlightCard({ flight: f }) {
  const dep = new Date(f.departureTime);
  return (
    <div className="flight-card">
      <div className="flight-card-top">
        <StatusBadge status={f.status} />
        <span className="flight-number">{f.flightNumber}</span>
      </div>
      <div className="flight-route">
        <div className="route-city"><div className="route-code">{f.source}</div></div>
        <div className="route-line">
          <div className="route-dots" />
          <span className="route-plane">✈</span>
          <div className="route-dots" />
        </div>
        <div className="route-city route-city-right"><div className="route-code">{f.destination}</div></div>
      </div>
      <div className="flight-meta">
        <div className="meta-item">
          <span className="meta-label">Departure</span>
          <span className="meta-value">
            {dep.toLocaleDateString()} {dep.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Seats</span>
          <span className="meta-value">{f.availableSeats}<span className="meta-dim">/{f.totalSeats}</span></span>
        </div>
      </div>
      {f.delayMinutes > 0 && <div className="delay-banner">⚠ Delayed by {f.delayMinutes} min</div>}
      <div className="flight-id-row">ID #{f.id}</div>
    </div>
  );
}

// BOOK TAB - LOGIN REQUIRED
function BookTab({ flights, showToast, token, onLoginRequired }) {
  const [passengers, setPassengers] = useState([]);
  const [pForm, setPForm] = useState({ name: "", email: "", phone: "", passportNumber: "" });
  const [bForm, setBForm] = useState({ flightId: "", passengerId: "", seatNumber: "" });
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("register");

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/passengers`, { headers: { "Authorization": `Bearer ${token}` } })
      .then((r) => r.json()).then(setPassengers).catch(() => {});
  }, [token]);

  if (!token) {
    return (
      <div className="tab-content">
        <div className="empty-state" style={{ marginTop: "80px" }}>
          <div className="empty-icon">🔒</div>
          <div style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Login Required</div>
          <div style={{ color: "#888", marginBottom: "20px" }}>Please login to book flights</div>
          <button className="btn btn-primary" onClick={onLoginRequired}>Login / Register</button>
        </div>
      </div>
    );
  }

  const addPassenger = async () => {
    if (!pForm.name || !pForm.email) { showToast("Name and email required", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/passengers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(pForm),
      });
      if (res.ok) {
        showToast("Passenger registered!");
        const updated = await fetch(`${API}/passengers`, { headers: { "Authorization": `Bearer ${token}` } }).then((r) => r.json());
        setPassengers(updated);
        setPForm({ name: "", email: "", phone: "", passportNumber: "" });
      } else { showToast("Error registering passenger", "error"); }
    } finally { setSubmitting(false); }
  };

  const BOOKABLE = ["ON_TIME", "DELAYED", "BOARDING"];

  const bookFlight = async () => {
    if (!bForm.flightId || !bForm.passengerId || !bForm.seatNumber) {
      showToast("Fill all booking fields", "error"); return;
    }
    const selected = flights.find((f) => f.id === Number(bForm.flightId));
    if (selected && !BOOKABLE.includes(selected.status)) {
      showToast(`Cannot book a ${selected.status} flight`, "error"); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ flightId: Number(bForm.flightId), passengerId: Number(bForm.passengerId), seatNumber: bForm.seatNumber }),
      });
      if (res.ok) { showToast("Booking confirmed! ✈"); setBForm({ flightId: "", passengerId: "", seatNumber: "" }); }
      else { showToast("Booking failed", "error"); }
    } finally { setSubmitting(false); }
  };

  return (
    <div className="tab-content">
      <div className="inner-tabs">
        <button className={`inner-tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>Register Passenger</button>
        <button className={`inner-tab ${tab === "book" ? "active" : ""}`} onClick={() => setTab("book")}>Book Flight</button>
      </div>
      {tab === "register" && (
        <div className="card card-narrow">
          <div className="card-header"><span className="card-icon">👤</span><h3>New Passenger</h3></div>
          {[
            { key: "name", label: "Full Name", placeholder: "Khushi Sharma", type: "text" },
            { key: "email", label: "Email", placeholder: "khushi@example.com", type: "email" },
            { key: "phone", label: "Phone", placeholder: "+91 98765 43210", type: "tel" },
            { key: "passportNumber", label: "Passport / ID", placeholder: "A1234567", type: "text" },
          ].map(({ key, label, placeholder, type }) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input type={type} value={pForm[key]} placeholder={placeholder}
                onChange={(e) => setPForm({ ...pForm, [key]: e.target.value })} />
            </div>
          ))}
          <button className="btn btn-primary" onClick={addPassenger} disabled={submitting}>
            {submitting ? <span className="spinner" /> : "Register Passenger"}
          </button>
        </div>
      )}
      {tab === "book" && (
        <div className="card card-narrow">
          <div className="card-header"><span className="card-icon">🎫</span><h3>New Booking</h3></div>
          <div className="form-group">
            <label>Select Flight</label>
            <select value={bForm.flightId} onChange={(e) => setBForm({ ...bForm, flightId: e.target.value })}>
              <option value="">— Choose a flight —</option>
              {flights.map((f) => {
                const bookable = BOOKABLE.includes(f.status);
                return (
                  <option key={f.id} value={f.id} disabled={!bookable}>
                    {f.flightNumber} · {f.source} → {f.destination}
                    {bookable ? ` · ${f.availableSeats} seats left` : ` (${STATUS_META[f.status]?.label || f.status})`}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="form-group">
            <label>Select Passenger</label>
            <select value={bForm.passengerId} onChange={(e) => setBForm({ ...bForm, passengerId: e.target.value })}>
              <option value="">— Choose a passenger —</option>
              {passengers.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.email}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Seat Number</label>
            <input value={bForm.seatNumber} placeholder="e.g. 14A"
              onChange={(e) => setBForm({ ...bForm, seatNumber: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={bookFlight} disabled={submitting}>
            {submitting ? <span className="spinner" /> : "Confirm Booking"}
          </button>
        </div>
      )}
    </div>
  );
}

// ADMIN TAB - LOGIN REQUIRED
function AdminTab({ flights, showToast, token, refresh, onLoginRequired }) {
  const [form, setForm] = useState({ flightNumber: "", source: "", destination: "", departureTime: "", totalSeats: "", availableSeats: "" });
  const [updateId, setUpdateId] = useState("");
  const [newStatus, setNewStatus] = useState("DELAYED");
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="tab-content">
        <div className="empty-state" style={{ marginTop: "80px" }}>
          <div className="empty-icon">🔒</div>
          <div style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Admin Access Required</div>
          <div style={{ color: "#888", marginBottom: "20px" }}>Login to manage flights</div>
          <button className="btn btn-primary" onClick={onLoginRequired}>Login / Register</button>
        </div>
      </div>
    );
  }

  const addFlight = async () => {
    if (!form.flightNumber || !form.source || !form.destination) {
      showToast("Please fill required fields", "error"); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/flights`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ ...form, totalSeats: Number(form.totalSeats), availableSeats: Number(form.availableSeats) }),
      });
      if (res.ok) { showToast("Flight added!"); setForm({ flightNumber: "", source: "", destination: "", departureTime: "", totalSeats: "", availableSeats: "" }); refresh(); }
      else { showToast("Error adding flight", "error"); }
    } finally { setSubmitting(false); }
  };

  const updateStatus = async () => {
    if (!updateId) { showToast("Enter Flight ID", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/flights/${updateId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, delayMinutes: Number(delayMinutes) }),
      });
      if (res.ok) { showToast("Status updated!"); refresh(); }
      else { showToast("Error updating status", "error"); }
    } finally { setSubmitting(false); }
  };

  return (
    <div className="tab-content">
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-icon">＋</span><h3>Add New Flight</h3></div>
          {[
            { key: "flightNumber", label: "Flight Number", placeholder: "e.g. AI202" },
            { key: "source", label: "Origin", placeholder: "e.g. DEL" },
            { key: "destination", label: "Destination", placeholder: "e.g. BOM" },
          ].map(({ key, label, placeholder }) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input value={form[key]} placeholder={placeholder} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div className="form-row">
            <div className="form-group">
              <label>Total Seats</label>
              <input type="number" value={form.totalSeats} placeholder="180" onChange={(e) => setForm({ ...form, totalSeats: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Available</label>
              <input type="number" value={form.availableSeats} placeholder="45" onChange={(e) => setForm({ ...form, availableSeats: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Departure Time</label>
            <input type="datetime-local" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={addFlight} disabled={submitting}>
            {submitting ? <span className="spinner" /> : "Add Flight"}
          </button>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-icon">⟳</span><h3>Update Status</h3></div>
          <div className="form-group">
            <label>Flight ID</label>
            <input value={updateId} placeholder="Enter flight ID" onChange={(e) => setUpdateId(e.target.value)} />
          </div>
          <div className="form-group">
            <label>New Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {Object.keys(STATUS_META).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Delay Duration (minutes)</label>
            <input type="number" value={delayMinutes} onChange={(e) => setDelayMinutes(e.target.value)} />
          </div>
          <div className="status-preview"><span>Preview:</span><StatusBadge status={newStatus} /></div>
          <button className="btn btn-primary" onClick={updateStatus} disabled={submitting}>
            {submitting ? <span className="spinner" /> : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ALERTS TAB - PUBLIC
function AlertsTab({ showToast }) {
  const [passengerId, setPassengerId] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const ALERT_ICONS = {
    DELAYED:   { icon: "⏱", cls: "alert-delayed"   },
    CANCELLED: { icon: "✕",  cls: "alert-cancelled" },
    DEFAULT:   { icon: "ℹ",  cls: "alert-info"      },
  };

  const getAlertMeta = (msg = "") => {
    if (msg.toUpperCase().includes("CANCEL")) return ALERT_ICONS.CANCELLED;
    if (msg.toUpperCase().includes("DELAY"))  return ALERT_ICONS.DELAYED;
    return ALERT_ICONS.DEFAULT;
  };

  const getAlerts = async () => {
    if (!passengerId) { showToast("Enter Passenger ID", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/alerts/${passengerId}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data); setSearched(true);
        if (data.length === 0) showToast("No alerts found", "info");
      } else { setAlerts([]); setSearched(true); showToast("Passenger not found", "error"); }
    } catch { showToast("Failed to fetch alerts", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="tab-content">
      <div className="card card-narrow">
        <div className="card-header"><span className="card-icon">🔔</span><h3>Passenger Alerts</h3></div>
        <div className="alert-search-row">
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Passenger ID</label>
            <input value={passengerId} placeholder="Enter passenger ID"
              onChange={(e) => setPassengerId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && getAlerts()} />
          </div>
          <button className="btn btn-primary alert-btn" onClick={getAlerts} disabled={loading}>
            {loading ? <span className="spinner" /> : "Search"}
          </button>
        </div>
      </div>
      {searched && (
        <div style={{ marginTop: "16px" }}>
          {alerts.length === 0
            ? <div className="empty-state"><div className="empty-icon">🔕</div><div>No alerts found</div></div>
            : <>
                <div className="section-header">
                  <h2 className="section-title">Alerts <span className="count-chip">{alerts.length}</span></h2>
                </div>
                <div className="alert-list">
                  {alerts.map((a, i) => {
                    const meta = getAlertMeta(a.message);
                    return (
                      <div key={i} className={`alert-item ${meta.cls}`}>
                        <div className="alert-icon-wrap">{meta.icon}</div>
                        <div className="alert-body">
                          <div className="alert-msg">{a.message}</div>
                          <div className="alert-time">
                            {new Date(a.alertTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
          }
        </div>
      )}
    </div>
  );
}

export default App;
