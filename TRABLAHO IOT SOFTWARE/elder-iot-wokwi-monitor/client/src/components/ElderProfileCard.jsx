import { Battery, Mail, MapPin, Phone, UserRound, Wifi } from "lucide-react";
import { formatDateTime, statusMeta } from "../constants/monitoring";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ID";
}

export default function ElderProfileCard({ elder, device, latestReading }) {
  const status = statusMeta(elder?.currentStatus);
  const hasGps = Number.isFinite(Number(elder?.lastLatitude)) && Number.isFinite(Number(elder?.lastLongitude));

  return (
    <section className="card profile-card">
      <div className="profile-hero">
        <div className={`avatar avatar-${status.tone}`}>
          {initials(elder?.name)}
        </div>
        <div>
          <span className="eyebrow">Paciente monitorado</span>
          <h2>{elder?.name || "--"}</h2>
          <p>{elder?.age ? `${elder.age} anos` : "Idade nao informada"}</p>
        </div>
        <span className={`status-chip status-chip-${status.tone}`}>{status.label}</span>
      </div>

      <div className="profile-metrics">
        <span><Battery size={16} /> {device?.batteryLevel ?? latestReading?.batteryLevel ?? "--"}%</span>
        <span><Wifi size={16} /> {device?.status || "OFFLINE"}</span>
        <span><MapPin size={16} /> {hasGps ? elder.lastLocationSource || "GPS" : "Sem GPS"}</span>
      </div>

      <dl className="detail-list">
        <div><dt><UserRound size={14} /> Responsavel</dt><dd>{elder?.responsibleName || "--"}</dd></div>
        <div><dt><Phone size={14} /> Telefone</dt><dd>{elder?.responsiblePhone || elder?.emergencyContact || "--"}</dd></div>
        <div><dt><Mail size={14} /> E-mail</dt><dd>{elder?.responsibleEmail || "--"}</dd></div>
        <div><dt>Ultimo movimento</dt><dd>{latestReading?.scenario || latestReading?.eventType || "Aguardando leitura"}</dd></div>
        <div><dt>Ultima atualizacao</dt><dd>{formatDateTime(elder?.lastSeenAt)}</dd></div>
        <div><dt>Obs. medicas</dt><dd>{elder?.medicalNotes || "--"}</dd></div>
      </dl>
    </section>
  );
}
