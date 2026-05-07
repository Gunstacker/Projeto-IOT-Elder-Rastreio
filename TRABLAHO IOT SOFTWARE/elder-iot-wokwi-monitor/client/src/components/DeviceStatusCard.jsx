import { Battery, RadioTower } from "lucide-react";

export default function DeviceStatusCard({ device }) {
  const isPhone = String(device?.deviceType || "").toUpperCase().includes("SMARTPHONE");

  return (
    <section className="card">
      <div className="section-heading">
        <h2>Dispositivo</h2>
        <span className={`status-dot status-${String(device?.status || "OFFLINE").toLowerCase()}`}>
          {device?.status || "OFFLINE"}
        </span>
      </div>
      <dl className="detail-list">
        <div><dt>Device ID</dt><dd>{device?.deviceId || "--"}</dd></div>
        <div><dt>Tipo</dt><dd>{device?.deviceType || "--"}</dd></div>
        <div><dt>Firmware</dt><dd>{device?.firmwareVersion || "--"}</dd></div>
        <div><dt>RSSI</dt><dd><RadioTower size={15} /> {device?.rssi ?? "--"}</dd></div>
        <div><dt>Bateria</dt><dd><Battery size={15} /> {device?.batteryLevel ?? "--"}%</dd></div>
        <div><dt>Ultimo sinal</dt><dd>{device?.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "--"}</dd></div>
        <div><dt>Fonte</dt><dd>{isPhone ? "Celular conectado" : "Dispositivo de monitoramento"}</dd></div>
      </dl>
    </section>
  );
}
