import {
  Activity,
  AlertTriangle,
  Cpu,
  MapPin,
  Radio,
  Shield,
  Smartphone,
  Users
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Activity },
  { path: "/events", label: "Eventos", icon: AlertTriangle },
  { path: "/elders", label: "Idosos", icon: Users },
  { path: "/devices", label: "Dispositivos", icon: Cpu },
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
  elders,
  selectedElderId,
  onSelectedElderChange
}) {
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
              </button>
            );
          })}
        </nav>
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
            <span className={`pill ${health?.status === "ok" ? "pill-ok" : "pill-muted"}`}>
              API {health?.status || "carregando"}
            </span>
            <span className={`pill ${socketConnected ? "pill-ok" : "pill-warn"}`}>
              WebSocket {socketConnected ? "online" : "offline"}
            </span>
            <span className="pill pill-muted">
              <MapPin size={14} />
              {health?.serverTime ? new Date(health.serverTime).toLocaleTimeString() : "--:--"}
            </span>
          </div>
        </header>

        {loadError ? <div className="inline-error">{loadError}</div> : null}
        {children}
      </main>
    </div>
  );
}
