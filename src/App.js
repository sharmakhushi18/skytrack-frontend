import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:8080";

function App() {
  const [flights, setFlights] = useState([]);
  const [activeTab, setActiveTab] = useState("flights");

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    const res = await fetch(`${API}/flights`);
    const data = await res.json();
    setFlights(data);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <h1>✈️ Flight Delay Alert System</h1>

        <div className="tabs">
          <button
            onClick={() => setActiveTab("flights")}
            className={activeTab === "flights" ? "active" : ""}
          >
            Flights
          </button>

          <button
            onClick={() => setActiveTab("book")}
            className={activeTab === "book" ? "active" : ""}
          >
            Book
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={activeTab === "alerts" ? "active" : ""}
          >
            Alerts
          </button>
        </div>
      </nav>

      <main>
        {activeTab === "flights" && (
          <FlightsTab flights={flights} refresh={fetchFlights} />
        )}

        {activeTab === "book" && <BookTab flights={flights} />}

        {activeTab === "alerts" && <AlertsTab />}
      </main>
    </div>
  );
}

/* FLIGHTS TAB */

function FlightsTab({ flights, refresh }) {
  const [form, setForm] = useState({
    flightNumber: "",
    source: "",
    destination: "",
    departureTime: "",
    totalSeats: "",
    availableSeats: "",
  });

  const [msg, setMsg] = useState("");

  const [updateId, setUpdateId] = useState("");
  const [newStatus, setNewStatus] = useState("DELAYED");
  const [delayMinutes, setDelayMinutes] = useState(30);

  const addFlight = async () => {
    const res = await fetch(`${API}/flights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        totalSeats: Number(form.totalSeats),
        availableSeats: Number(form.availableSeats),
      }),
    });

    if (res.ok) {
      setMsg("Flight added");
      refresh();
    } else {
      setMsg("Error adding flight");
    }
  };

  const updateStatus = async () => {
    const res = await fetch(`${API}/flights/${updateId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        delayMinutes: Number(delayMinutes),
      }),
    });

    if (res.ok) {
      setMsg("Status updated");
      refresh();
    } else {
      setMsg("Error updating status");
    }
  };

  return (
    <div>
      <div className="grid-2">
        <div className="card">
          <h2>Add Flight</h2>

          {["flightNumber", "source", "destination"].map((f) => (
            <div className="form-group" key={f}>
              <label>{f}</label>
              <input
                value={form[f]}
                onChange={(e) =>
                  setForm({ ...form, [f]: e.target.value })
                }
              />
            </div>
          ))}

          <div className="form-group">
            <label>Departure Time</label>
            <input
              type="datetime-local"
              value={form.departureTime}
              onChange={(e) =>
                setForm({ ...form, departureTime: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Total Seats</label>
            <input
              type="number"
              value={form.totalSeats}
              onChange={(e) =>
                setForm({ ...form, totalSeats: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Available Seats</label>
            <input
              type="number"
              value={form.availableSeats}
              onChange={(e) =>
                setForm({ ...form, availableSeats: e.target.value })
              }
            />
          </div>

          <button className="btn" onClick={addFlight}>
            Add Flight
          </button>

          {msg && <p>{msg}</p>}
        </div>

        <div className="card">
          <h2>Update Flight Status</h2>

          <div className="form-group">
            <label>Flight ID</label>
            <input
              value={updateId}
              onChange={(e) => setUpdateId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option>ON_TIME</option>
              <option>DELAYED</option>
              <option>BOARDING</option>
              <option>CANCELLED</option>
              <option>DEPARTED</option>
            </select>
          </div>

          <div className="form-group">
            <label>Delay Minutes</label>
            <input
              type="number"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(e.target.value)}
            />
          </div>

          <button className="btn" onClick={updateStatus}>
            Update Status
          </button>

          {msg && <p>{msg}</p>}
        </div>
      </div>

      <h2>All Flights</h2>

      <div className="flight-grid">
        {flights.map((f) => (
          <div className="flight-card" key={f.id}>
            <span className={`status ${f.status}`}>{f.status}</span>

            <div className="flight-route">
              {f.source} → {f.destination}
            </div>

            <div className="flight-info">
              Flight: {f.flightNumber}
            </div>

            <div className="flight-info">
              {new Date(f.departureTime).toLocaleString()}
            </div>

            <div className="flight-info">
              Seats: {f.availableSeats}/{f.totalSeats}
            </div>

            {f.delayMinutes > 0 && (
              <div className="flight-info">
                Delay: {f.delayMinutes} mins
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* BOOK TAB */

function BookTab({ flights }) {
  const [passengers, setPassengers] = useState([]);

  const [pForm, setPForm] = useState({
    name: "",
    email: "",
    phone: "",
    passportNumber: "",
  });

  const [bForm, setBForm] = useState({
    flightId: "",
    passengerId: "",
    seatNumber: "",
  });

  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/passengers`)
      .then((r) => r.json())
      .then(setPassengers);
  }, []);

  const addPassenger = async () => {
    const res = await fetch(`${API}/passengers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pForm),
    });

    if (res.ok) {
      setMsg("Passenger registered");
    } else {
      setMsg("Error registering passenger");
    }
  };

  const bookFlight = async () => {
    const res = await fetch(`${API}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flightId: Number(bForm.flightId),
        passengerId: Number(bForm.passengerId),
        seatNumber: bForm.seatNumber,
      }),
    });

    if (res.ok) {
      setMsg("Booking confirmed");
    } else {
      setMsg("Booking failed");
    }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <h2>Register Passenger</h2>

        {["name", "email", "phone", "passportNumber"].map((f) => (
          <div className="form-group" key={f}>
            <label>{f}</label>
            <input
              value={pForm[f]}
              onChange={(e) =>
                setPForm({ ...pForm, [f]: e.target.value })
              }
            />
          </div>
        ))}

        <button className="btn" onClick={addPassenger}>
          Register
        </button>

        {msg && <p>{msg}</p>}
      </div>

      <div className="card">
        <h2>Book Flight</h2>

        <div className="form-group">
          <label>Select Flight</label>

          <select
            value={bForm.flightId}
            onChange={(e) =>
              setBForm({ ...bForm, flightId: e.target.value })
            }
          >
            <option value="">Select</option>

            {flights.map((f) => (
              <option key={f.id} value={f.id}>
                {f.flightNumber} | {f.source} → {f.destination}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Select Passenger</label>

          <select
            value={bForm.passengerId}
            onChange={(e) =>
              setBForm({ ...bForm, passengerId: e.target.value })
            }
          >
            <option value="">Select</option>

            {passengers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Seat Number</label>

          <input
            value={bForm.seatNumber}
            onChange={(e) =>
              setBForm({ ...bForm, seatNumber: e.target.value })
            }
          />
        </div>

        <button className="btn" onClick={bookFlight}>
          Book Flight
        </button>

        {msg && <p>{msg}</p>}
      </div>
    </div>
  );
}

/* ALERTS TAB */

function AlertsTab() {
  const [passengerId, setPassengerId] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [msg, setMsg] = useState("");

  const getAlerts = async () => {
    const res = await fetch(`${API}/alerts/${passengerId}`);

    if (res.ok) {
      const data = await res.json();
      setAlerts(data);
    } else {
      setMsg("No alerts found");
    }
  };

  return (
    <div className="card">
      <h2>Check Alerts</h2>

      <div className="form-group">
        <label>Passenger ID</label>

        <input
          value={passengerId}
          onChange={(e) => setPassengerId(e.target.value)}
        />
      </div>

      <button className="btn" onClick={getAlerts}>
        Get Alerts
      </button>

      {msg && <p>{msg}</p>}

      <div style={{ marginTop: "20px" }}>
        {alerts.map((a, i) => (
          <div className="alert-item" key={i}>
            <div className="alert-msg">{a.message}</div>
            <div className="alert-time">
              {new Date(a.alertTime).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;