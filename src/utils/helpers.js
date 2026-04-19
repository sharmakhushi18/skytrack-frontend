// ── Date Formatting ──────────────────────────────────────────────────────────
export const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d) ? "-" : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

export const formatTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d) ? "-" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d) ? "-" : d.toLocaleDateString();
};

// ── Status Helpers ────────────────────────────────────────────────────────────
export const STATUS_META = Object.freeze({
  ON_TIME:   { label: "On Time",   icon: "●", cls: "s-ontime" },
  DELAYED:   { label: "Delayed",   icon: "◐", cls: "s-delayed" },
  CANCELLED: { label: "Cancelled", icon: "✕", cls: "s-cancelled" },
  BOARDING:  { label: "Boarding",  icon: "▶", cls: "s-boarding" },
  DEPARTED:  { label: "Departed",  icon: "↑", cls: "s-departed" },
});

// fallback-safe accessor
export const getStatusMeta = (status) =>
  STATUS_META[status] || { label: "Unknown", icon: "?", cls: "s-unknown" };

// ── Booking Logic ─────────────────────────────────────────────────────────────
export const BOOKABLE_STATUSES = new Set(["ON_TIME", "DELAYED", "BOARDING"]);

export const isBookable = (status) => BOOKABLE_STATUSES.has(status);

// ── Stats Calculator (Optimized O(n)) ─────────────────────────────────────────
export const calcFlightStats = (flights = []) => {
  const stats = {
    total: flights.length,
    onTime: 0,
    delayed: 0,
    cancelled: 0,
  };

  for (const f of flights) {
    switch (f.status) {
      case "ON_TIME":
        stats.onTime++;
        break;
      case "DELAYED":
        stats.delayed++;
        break;
      case "CANCELLED":
        stats.cancelled++;
        break;
    }
  }

  return stats;
};