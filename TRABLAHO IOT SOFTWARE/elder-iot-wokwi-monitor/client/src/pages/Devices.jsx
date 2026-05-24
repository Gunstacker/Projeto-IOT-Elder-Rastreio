import { Battery, Cpu, Gauge, RadioTower, Timer, Wifi } from "lucide-react";
import { formatDateTime } from "../constants/monitoring";

function minutesSince(value) {
  if (!value) {
    return "--";
  }

  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff)) {
    return "--";
  }

  return `${Math.max(0, Math.round(diff / 60000))} min`;
}

function healthScore(device) {
  const online = device.status === "ONLINE" ? 45 : 0;
  const battery = Math.max(0, Math.min(35, Number(device.batteryLevel || 0) * 0.35));
  const signal = Number.isFinite(Number(device.rssi)) ? Math.max(0, Math.min(20, 20 + Number(device.rssi) / 5)) : 8;
  return Math.round(online + battery + signal);
}

export default function Devices({ devices }) {
  return (
    <section className="card page-card devices-page">
      <div className="section-heading">
        <div>
          <h2>Dispositivos</h2>
          <span>{devices.length} cadastrados</span>
        </div>
      </div>

      <div className="device-list">
        {devices.map((device) => {
          const health = healthScore(device);
          return (
            <article key={device.deviceId} className="device-row device-row-rich">
              <div className={`device-icon device-icon-${device.status === "ONLINE" ? "online" : "offline"}`}>
                <Cpu size={24} />
              </div>
              <div>
                <strong>{device.deviceId}</strong>
                <span>{device.deviceType} | Firmware {device.firmwareVersion || "--"}</span>
                <span>Paciente vinculado: {device.elderName || device.elderId}</span>
                <div className="device-health compact">
                  <progress value={health} max="100" />
                  <span>{health}% saude geral</span>
                </div>
              </div>
              <dl>
                <div><dt><Wifi size={14} /> Status</dt><dd>{device.status}</dd></div>
                <div><dt><Battery size={14} /> Bateria</dt><dd>{device.batteryLevel ?? "--"}%</dd></div>
                <div><dt><RadioTower size={14} /> RSSI</dt><dd>{device.rssi ?? "--"}</dd></div>
                <div><dt><Gauge size={14} /> IP</dt><dd>{device.ip || "--"}</dd></div>
                <div><dt><Timer size={14} /> Latencia</dt><dd>{minutesSince(device.lastSeenAt)}</dd></div>
                <div><dt>Ultimo sinal</dt><dd>{formatDateTime(device.lastSeenAt)}</dd></div>
                <div><dt>Ultima queda</dt><dd>{formatDateTime(device.lastFallAt)}</dd></div>
              </dl>
            </article>
          );
        })}
        {!devices.length ? <p className="empty-state">Nenhum dispositivo cadastrado.</p> : null}
      </div>
    </section>
  );
}
