import { STATUS_META } from "../utils/helpers";

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, icon: "●", cls: "" };
  return (
    <span className={`badge ${m.cls}`}>
      <span className="badge-dot">{m.icon}</span>
      {m.label}
    </span>
  );
}

export default StatusBadge;