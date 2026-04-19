import { useState, useEffect } from "react";
import { addPassenger, fetchAllPassengers, bookFlight } from "../services/api";
import { isBookable, STATUS_META } from "../utils/helpers";

function BookingForm({ flights, showToast }) {
  const [passengers, setPassengers]           = useState([]);
  const [tab, setTab]                         = useState("register");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [bookingLoading, setBookingLoading]   = useState(false);

  const [pForm, setPForm] = useState({
    name: "", email: "", phone: "", passportNumber: "",
  });

  const [bForm, setBForm] = useState({
    flightId: "", passengerId: "", seatNumber: "",
  });

  // ── Load Passengers ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAllPassengers()
      .then(setPassengers)
      .catch(() => showToast("Failed to load passengers", "error"));
  }, []);

  // ── Register Passenger ──────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!pForm.name || !pForm.email) {
      showToast("Name and email are required", "error"); return;
    }
    if (!pForm.email.includes("@")) {
      showToast("Invalid email address", "error"); return;
    }

    setRegisterLoading(true);
    try {
      await addPassenger(pForm);
      showToast("Passenger registered successfully");
      const updated = await fetchAllPassengers();
      setPassengers(updated);
      setPForm({ name: "", email: "", phone: "", passportNumber: "" });
    } catch (err) {
      showToast(err.message || "Error registering passenger", "error");
    } finally {
      setRegisterLoading(false);
    }
  };

  // ── Book Flight ─────────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!bForm.flightId || !bForm.passengerId || !bForm.seatNumber) {
      showToast("Fill all booking fields", "error"); return;
    }
    if (!/^[0-9]+[A-Z]$/.test(bForm.seatNumber)) {
      showToast("Invalid seat format (e.g. 12A)", "error"); return;
    }
    const selected = flights.find((f) => f.id === Number(bForm.flightId));
    if (selected && !isBookable(selected.status)) {
      showToast(`Cannot book a ${selected.status} flight`, "error"); return;
    }

    setBookingLoading(true);
    try {
      await bookFlight(Number(bForm.flightId), Number(bForm.passengerId), bForm.seatNumber);
      showToast("Booking confirmed! ✈");
      setBForm({ flightId: "", passengerId: "", seatNumber: "" });
    } catch (err) {
      showToast(err.message || "Booking failed", "error");
    } finally {
      setBookingLoading(false);
    }
  };

  const pFields = [
    { key: "name",           label: "Full Name",     placeholder: "Khushi Sharma",      type: "text"  },
    { key: "email",          label: "Email Address", placeholder: "khushi@example.com", type: "email" },
    { key: "phone",          label: "Phone Number",  placeholder: "+91 98765 43210",     type: "tel"   },
    { key: "passportNumber", label: "Passport / ID", placeholder: "A1234567",            type: "text"  },
  ];

  return (
    <div className="tab-content">
      <div className="inner-tabs">
        <button className={`inner-tab ${tab === "register" ? "active" : ""}`}
          onClick={() => setTab("register")}>Register Passenger</button>
        <button className={`inner-tab ${tab === "book" ? "active" : ""}`}
          onClick={() => setTab("book")}>Book Flight</button>
      </div>

      {tab === "register" && (
        <div className="card card-narrow">
          <div className="card-header">
            <span className="card-icon">👤</span>
            <h3>New Passenger</h3>
          </div>
          {pFields.map(({ key, label, placeholder, type }) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input
                type={type}
                value={pForm[key]}
                placeholder={placeholder}
                onChange={(e) => setPForm({ ...pForm, [key]: e.target.value })}
              />
            </div>
          ))}
          <button className="btn btn-primary" onClick={handleRegister} disabled={registerLoading}>
            {registerLoading ? <span className="spinner" /> : "Register Passenger"}
          </button>
        </div>
      )}

      {tab === "book" && (
        <div className="card card-narrow">
          <div className="card-header">
            <span className="card-icon">🎫</span>
            <h3>New Booking</h3>
          </div>
          <div className="form-group">
            <label>Select Flight</label>
            <select value={bForm.flightId}
              onChange={(e) => setBForm({ ...bForm, flightId: e.target.value })}>
              <option value="">— Choose a flight —</option>
              {flights.map((f) => {
                const bookable = isBookable(f.status);
                return (
                  <option key={f.id} value={f.id} disabled={!bookable}>
                    {f.flightNumber} · {f.source} → {f.destination}
                    {bookable
                      ? ` · ${f.availableSeats} seats left`
                      : ` (${STATUS_META[f.status]?.label || f.status})`}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="form-group">
            <label>Select Passenger</label>
            <select value={bForm.passengerId}
              onChange={(e) => setBForm({ ...bForm, passengerId: e.target.value })}>
              <option value="">— Choose a passenger —</option>
              {passengers.map((p) => (
                <option key={p.id} value={p.id}>{p.name} · {p.email}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Seat Number</label>
            <input
              value={bForm.seatNumber}
              placeholder="e.g. 14A"
              onChange={(e) => setBForm({ ...bForm, seatNumber: e.target.value.toUpperCase() })}
            />
          </div>
          <button className="btn btn-primary" onClick={handleBook} disabled={bookingLoading}>
            {bookingLoading ? <span className="spinner" /> : "Confirm Booking"}
          </button>
        </div>
      )}
    </div>
  );
}

export default BookingForm;