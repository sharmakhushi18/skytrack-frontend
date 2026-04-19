import { useState } from "react";
import StatusBadge from "./StatusBadge";
import { addFlight, updateFlightStatus } from "../services/api";
import { STATUS_META, calcFlightStats, formatDate, formatTime } from "../utils/helpers";

// ── Stat Card ─────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card" style={{ "--accent": accent }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────
function FlightSkeleton() {
  return (
    <div className="flight-card skeleton-card">
      {[80, 120, 60, 60, 90].map((w, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

// ── Flight Card ───────────────────────────────────
function FlightCard({ flight: f }) {
  return (
    <div className="flight-card">
      <div className="flight-card-top">
        <StatusBadge status={f.status} />
        <span className="flight-number">{f.flightNumber}</span>
      </div>

      <div className="flight-route">
        <div className="route-city">
          <div className="route-code">{f.source}</div>
        </div>
        <div className="route-line">
          <div className="route-dots" />
          <span className="route-plane">✈</span>
          <div className="route-dots" />
        </div>
        <div className="route-city route-city-right">
          <div className="route-code">{f.destination}</div>
        </div>
      </div>

      <div className="flight-meta">
        <div className="meta-item">
          <span className="meta-label">Departure</span>
          <span className="meta-value">
            {formatDate(f.departureTime)} {formatTime(f.departureTime)}
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Seats</span>
          <span className="meta-value">
            {f.availableSeats}<span className="meta-dim">/{f.totalSeats}</span>
          </span>
        </div>
      </div>

      {f.delayMinutes > 0 && (
        <div className="delay-banner">⚠ Delayed by {f.delayMinutes} min</div>
      )}

      <div className="flight-id-row">ID #{f.id}</div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────
function FlightList({ flights = [], loading, refresh, showToast }) {
  const [form, setForm] = useState({
    flightNumber: "",
    source: "",
    destination: "",
    departureTime: "",
    totalSeats: "",
    availableSeats: "",
  });

  const [updateId, setUpdateId] = useState("");
  const [newStatus, setNewStatus] = useState("DELAYED");
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [submitting, setSubmitting] = useState(false);

  const stats = calcFlightStats(flights);

  const filtered = (flights || []).filter((f) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.flightNumber?.toLowerCase().includes(q) ||
      f.source?.toLowerCase().includes(q) ||
      f.destination?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "ALL" || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // 🔥 FIXED ADD FLIGHT
  const handleAddFlight = async () => {
    if (!form.flightNumber || !form.source || !form.destination || !form.departureTime) {
      showToast("Fill all required fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      await addFlight({
        ...form,
        departureTime: form.departureTime + ":00", // ✅ FIX
        totalSeats: Number(form.totalSeats),
        availableSeats: Number(form.availableSeats),
      });

      showToast("Flight added successfully");

      setForm({
        flightNumber: "",
        source: "",
        destination: "",
        departureTime: "",
        totalSeats: "",
        availableSeats: "",
      });

      refresh();
    } catch (err) {
      console.error(err);
      showToast("Error adding flight", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!updateId) {
      showToast("Enter Flight ID", "error");
      return;
    }

    setSubmitting(true);
    try {
      await updateFlightStatus(updateId, newStatus, Number(delayMinutes));
      showToast("Status updated");
      refresh();
    } catch {
      showToast("Error updating status", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { key: "flightNumber", label: "Flight Number", placeholder: "AI101" },
    { key: "source", label: "Origin", placeholder: "DEL" },
    { key: "destination", label: "Destination", placeholder: "BOM" },
  ];

  return (
    <div className="tab-content">
      {/* Stats */}
      <div className="stats-row">
        <StatCard label="Total Flights" value={stats.total} accent="#7c8cf8" />
        <StatCard label="On Time" value={stats.onTime} accent="#00d97e" />
        <StatCard label="Delayed" value={stats.delayed} accent="#f6a935" />
        <StatCard label="Cancelled" value={stats.cancelled} accent="#f25c6e" />
      </div>

      {/* Add Flight */}
      <div className="card">
        <h3>Add Flight</h3>

        {fields.map(({ key, label, placeholder }) => (
          <input
            key={key}
            placeholder={placeholder}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        ))}

        <input
          type="datetime-local"
          value={form.departureTime}
          onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
        />

        <input
          type="number"
          placeholder="Total Seats"
          value={form.totalSeats}
          onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
        />

        <input
          type="number"
          placeholder="Available Seats"
          value={form.availableSeats}
          onChange={(e) => setForm({ ...form, availableSeats: e.target.value })}
        />

        <button onClick={handleAddFlight} disabled={submitting}>
          Add Flight
        </button>
      </div>

      {/* Flights */}
      <div className="flight-grid">
        {loading
          ? Array(5).fill(0).map((_, i) => <FlightSkeleton key={i} />)
          : filtered.map((f) => <FlightCard key={f.id} flight={f} />)}
      </div>
    </div>
  );
}

export default FlightList;