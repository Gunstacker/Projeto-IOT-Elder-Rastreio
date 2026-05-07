import { Cpu } from "lucide-react";

export default function Devices({ devices }) {
  return (
    <section className="card page-card">
      <div className="section-heading">
        <h2>Dispositivos</h2>
        <span>{devices.length} cadastrados</span>
      </div>

      <div className="device-list">
        {devices.map((device) => (
          <article key={device.deviceId} className="device-row">
            <Cpu size={26} />
            <div>
              <strong>{device.deviceId}</strong>
              <span>{device.deviceType} | Firmware {device.firmwareVersion}</span>
              <span>Idoso vinculado: {device.elderName || device.elderId}</span>
            </div>
            <dl>
              <div><dt>Status</dt><dd>{device.status}</dd></div>
              <div><dt>Bateria</dt><dd>{device.batteryLevel ?? "--"}%</dd></div>
              <div><dt>Ultimo sinal</dt><dd>{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "--"}</dd></div>
              <div><dt>Ultima queda</dt><dd>{device.lastFallAt ? new Date(device.lastFallAt).toLocaleString() : "--"}</dd></div>
            </dl>
          </article>
        ))}
        {!devices.length ? <p className="empty-state">Nenhum dispositivo cadastrado.</p> : null}
      </div>
    </section>
  );
}
