function Navbar({ activeTab, setActiveTab, lastUpdated, onRefresh }) {
  const tabs = [
    { id: "flights", label: "Flights", icon: "✈" },
    { id: "book",    label: "Book",    icon: "🎫" },
    { id: "alerts",  label: "Alerts",  icon: "🔔" },
  ];

  return (
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
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
          >
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
        <button className="refresh-btn" onClick={onRefresh}>↻</button>
      </div>
    </header>
  );
}

export default Navbar;