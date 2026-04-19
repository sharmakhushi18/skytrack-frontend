import { useState } from "react";
import { fetchAlerts } from "../services/api";
import { formatDateTime } from "../utils/helpers";

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

function AlertList({ showToast }) {
  const [passengerId, setPassengerId] = useState("");
  const [alerts, setAlerts]           = useState([]);
  const [searched, setSearched]       = useState(false);
  const [loading, setLoading]         = useState(false);

  const handleSearch = async () => {
    if (!passengerId) { showToast("Enter a Passenger ID", "error"); return; }
    setLoading(true);
    try {
      const data = await fetchAlerts(passengerId);
      setAlerts(data);
      setSearched(true);
      if (data.length === 0) showToast("No alerts for this passenger", "info");
    } catch {
      setAlerts([]);
      setSearched(true);
      showToast("Passenger not found", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="tab-content">
      <div className="card card-narrow">
        <div className="card-header">
          <span className="card-icon">🔔</span>
          <h3>Passenger Alerts</h3>
        </div>
        <div className="alert-search-row">
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Passenger ID</label>
            <input value={passengerId} placeholder="Enter passenger ID"
              onChange={(e) => setPassengerId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          </div>
          <button className="btn btn-primary alert-btn" onClick={handleSearch} disabled={loading}>
            {loading ? <span className="spinner" /> : "Search"}
          </button>
        </div>
      </div>

      {searched && (
        <div style={{ marginTop: "16px" }}>
          {alerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔕</div>
              <div>No alerts found for this passenger</div>
            </div>
          ) : (
            <>
              <div className="section-header">
                <h2 className="section-title">
                  Alerts <span className="count-chip">{alerts.length}</span>
                </h2>
              </div>
              <div className="alert-list">
                {alerts.map((a, i) => {
                  const meta = getAlertMeta(a.message);
                  return (
                    <div key={i} className={`alert-item ${meta.cls}`}>
                      <div className="alert-icon-wrap">{meta.icon}</div>
                      <div className="alert-body">
                        <div className="alert-msg">{a.message}</div>
                        <div className="alert-time">{formatDateTime(a.alertTime)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AlertList;