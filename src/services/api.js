const BASE_URL = "https://flight-delay-alert-api.onrender.com";

// ── Flights ──────────────────────────────────────────────────────────────────
export const fetchAllFlights = async () => {
  const res = await fetch(`${BASE_URL}/flights`);
  if (!res.ok) throw new Error("Failed to fetch flights");
  return res.json();
};

export const addFlight = async (flightData) => {
  const res = await fetch(`${BASE_URL}/flights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(flightData),
  });
  if (!res.ok) throw new Error("Failed to add flight");
  return res.json();
};

export const updateFlightStatus = async (id, status, delayMinutes) => {
  const res = await fetch(`${BASE_URL}/flights/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, delayMinutes }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
};

// ── Passengers ───────────────────────────────────────────────────────────────
export const fetchAllPassengers = async () => {
  const res = await fetch(`${BASE_URL}/passengers`);
  if (!res.ok) throw new Error("Failed to fetch passengers");
  return res.json();
};

export const addPassenger = async (passengerData) => {
  const res = await fetch(`${BASE_URL}/passengers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(passengerData),
  });
  if (!res.ok) throw new Error("Failed to add passenger");
  return res.json();
};

// ── Bookings ─────────────────────────────────────────────────────────────────
export const bookFlight = async (flightId, passengerId, seatNumber) => {
  const res = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flightId, passengerId, seatNumber }),
  });
  if (!res.ok) throw new Error("Booking failed");
  return res.json();
};

// ── Alerts ───────────────────────────────────────────────────────────────────
export const fetchAlerts = async (passengerId) => {
  const res = await fetch(`${BASE_URL}/alerts/${passengerId}`);
  if (!res.ok) throw new Error("No alerts found");
  return res.json();
};