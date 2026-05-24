import { Activity, Battery, Clock3, ShieldAlert, WifiOff } from "lucide-react";
import { formatTime } from "../constants/monitoring";

function isToday(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value)));
  if (!valid.length) {
    return null;
  }

  return Math.round(valid.reduce((sum, value) => sum + Number(value), 0) / valid.length);
}

export default function DashboardAnalytics({ events = [], devices = [], readings = [] }) {
  const fallCount = events.filter((event) =>
    ["FALL_IMPACT_DETECTED", "POST_FALL_INACTIVITY"].includes(event.eventType)
  ).length;
  const todayEvents = events.filter((event) => isToday(event.createdAt)).length;
  const offlineDevices = devices.filter((device) => device.status === "OFFLINE").length;
  const onlineDevices = devices.filter((device) => device.status === "ONLINE").length;
  const averageBattery = average(devices.map((device) => device.batteryLevel));
  const activityBars = readings.slice(0, 18).reverse();
  const lastPayloadAt = readings[0]?.createdAt;

  return (
    <section className="card analytics-card">
      <div className="section-heading">
        <div>
          <h2>Analytics do monitoramento</h2>
          <span>Eventos, disponibilidade e atividade recente</span>
        </div>
        <span className="pill">Ultimo payload {formatTime(lastPayloadAt)}</span>
      </div>

      <div className="analytics-grid">
        <div className="analytics-metric">
          <ShieldAlert size={18} />
          <span>Quedas</span>
          <strong>{fallCount}</strong>
        </div>
        <div className="analytics-metric">
          <Activity size={18} />
          <span>Eventos hoje</span>
          <strong>{todayEvents}</strong>
        </div>
        <div className="analytics-metric">
          <Battery size={18} />
          <span>Bateria media</span>
          <strong>{averageBattery === null ? "--" : `${averageBattery}%`}</strong>
        </div>
        <div className="analytics-metric">
          <WifiOff size={18} />
          <span>Offline</span>
          <strong>{offlineDevices}/{devices.length || 0}</strong>
        </div>
      </div>

      <div className="activity-chart" aria-label="Grafico de atividade recente">
        {activityBars.length ? activityBars.map((reading) => {
          const height = Math.max(14, Math.min(100, Number(reading.accMagnitude || 0) * 24));
          const critical = Number(reading.riskScore || 0) >= 70;
          return (
            <span
              key={reading.id}
              className={critical ? "activity-bar activity-bar-critical" : "activity-bar"}
              style={{ height: `${height}%` }}
              title={`${formatTime(reading.createdAt)} | risco ${reading.riskScore ?? 0}`}
            />
          );
        }) : (
          <div className="chart-empty">
            <Clock3 size={18} />
            Aguardando leituras
          </div>
        )}
      </div>

      <div className="system-strip">
        <span className="status-dot status-online">Online {onlineDevices}</span>
        <span className="status-dot status-offline">Offline {offlineDevices}</span>
        <span>Janela: ultimas {readings.length} leituras carregadas</span>
      </div>
    </section>
  );
}
