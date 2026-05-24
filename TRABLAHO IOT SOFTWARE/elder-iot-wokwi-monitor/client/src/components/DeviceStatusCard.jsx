import { Battery, Clock3, Gauge, RadioTower, Router } from "lucide-react";
import { formatDateTime } from "../constants/monitoring";

function deviceHealth(device) {
  if (!device) {
    return 0;
  }

  const online = device.status === "ONLINE" ? 45 : 0;
  const battery = Math.max(0, Math.min(35, Number(device.batteryLevel || 0) * 0.35));
  const signal = Number.isFinite(Number(device.rssi)) ? Math.max(0, Math.min(20, 20 + Number(device.rssi) / 5)) : 8;
  return Math.round(online + battery + signal);
}

export default function DeviceStatusCard({ device }) {
  const isPhone = String(device?.deviceType || "").toUpperCase().includes("SMARTPHONE");
  const health = deviceHealth(device);

  return (
    <section className="card device-card">
      <div className="section-heading">
        <div>
          <h2>Dispositivo</h2>
          <span>{isPhone ? "Smartphone como sensor principal" : "Unidade IoT de monitoramento"}</span>
        </div>
        <span className={`status-dot status-${String(device?.status || "OFFLINE").toLowerCase()}`}>
          {device?.status || "OFFLINE"}
        </span>
      </div>
      <div className="device-health">
        <div>
          <span>Saude geral</span>
          <strong>{health}%</strong>
        </div>
        <progress value={health} max="100" />
      </div>
      <dl className="detail-list">
        <div><dt><Router size={14} /> Device ID</dt><dd>{device?.deviceId || "--"}</dd></div>
        <div><dt>Tipo</dt><dd>{device?.deviceType || "--"}</dd></div>
        <div><dt>Firmware</dt><dd>{device?.firmwareVersion || "--"}</dd></div>
        <div><dt>RSSI</dt><dd><RadioTower size={15} /> {device?.rssi ?? "--"}</dd></div>
        <div><dt>Bateria</dt><dd><Battery size={15} /> {device?.batteryLevel ?? "--"}%</dd></div>
        <div><dt><Clock3 size={14} /> Ultimo sinal</dt><dd>{formatDateTime(device?.lastSeenAt)}</dd></div>
        <div><dt><Gauge size={14} /> IP</dt><dd>{device?.ip || "--"}</dd></div>
        <div><dt>Fonte</dt><dd>{isPhone ? "Celular conectado" : "Dispositivo de monitoramento"}</dd></div>
      </dl>
    </section>
  );
}
