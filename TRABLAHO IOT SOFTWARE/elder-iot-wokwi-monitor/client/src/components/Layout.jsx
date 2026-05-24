import {
  Activity,
  AlertTriangle,
  Bell,
  Cpu,
  Database,
  MapPin,
  Radio,
  Shield,
  Smartphone,
  Users,
  Wifi
} from "lucide-react";
import { formatTime } from "../constants/monitoring";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Activity },
  { path: "/events", label: "Eventos", icon: AlertTriangle },
  { path: "/elders", label: "Idosos", icon: Users },
  { path: "/devices", label: "Dispositivos", icon: Cpu },
  { path: "/notifications", label: "Notificacoes", icon: Bell },
  { path: "/phone-gps", label: "Celular idoso", icon: Smartphone },
  { path: "/local-simulator", label: "Simulador", icon: Radio }
];

export default function Layout({
  children,
  path,
  navigate,
  health,
  socketConnected,
  loadError,
  devices = [],
  readings = [],
  events = [],
  isBooting,
  elders,
  selectedElderId,
  onSelectedElderChange
}) {
  const unresolvedEvents = events.filter((event) => !event.resolved).length;
  const wokwiOnline = devices.some((device) =>
    String(device.deviceType || "").toUpperCase().includes("WOKWI") && device.status === "ONLINE"
  );
  const lastPayloadAt = readings[0]?.createdAt;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Shield size={28} />
          <div>
            <strong>Elder IoT</strong>
            <span>Monitoramento</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className={`nav-item ${path === item.path ? "active" : ""}`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.path === "/events" && unresolvedEvents ? (
                  <b className="nav-badge">{unresolvedEvents}</b>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-status">
          <span className="status-dot status-online">API</span>
          <span className={`status-dot ${socketConnected ? "status-online" : "status-offline"}`}>WebSocket</span>
          <span className={`status-dot ${wokwiOnline ? "status-online" : "status-offline"}`}>Wokwi</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Central de monitoramento</h1>
            <p>Monitoramento em tempo real com celular, geolocalizacao e alertas automaticos.</p>
          </div>
          <div className="topbar-status">
            <label className="monitor-select">
              <span>Idoso monitorado</span>
              <select
                value={selectedElderId || ""}
                onChange={(event) => onSelectedElderChange(Number(event.target.value))}
                disabled={!elders.length}
              >
                {elders.length ? elders.map((elder) => (
                  <option key={elder.id} value={elder.id}>
                    {elder.name}
                  </option>
                )) : (
                  <option value="">Carregando</option>
                )}
              </select>
            </label>
            <span className={`pill ${health?.status === "ok" ? "pill-ok" : "pill-warn"}`}>
              <Wifi size={14} />
              API {isBooting ? "carregando" : health?.status || "offline"}
            </span>
            <span className={`pill ${socketConnected ? "pill-ok" : "pill-warn"}`}>
              WebSocket {socketConnected ? "online" : "offline"}
            </span>
            <span className={`pill ${health?.database === "ok" ? "pill-ok" : "pill-warn"}`}>
              <Database size={14} />
              PostgreSQL {health?.database || "--"}
            </span>
            <span className={`pill ${wokwiOnline ? "pill-ok" : "pill-warn"}`}>
              Wokwi {wokwiOnline ? "online" : "offline"}
            </span>
            <span className="pill pill-muted">
              <MapPin size={14} />
              Payload {formatTime(lastPayloadAt || health?.serverTime)}
            </span>
          </div>
        </header>

        {loadError ? <div className="inline-error">{loadError}</div> : null}
        {children}
      </main>
    </div>
  );
}
