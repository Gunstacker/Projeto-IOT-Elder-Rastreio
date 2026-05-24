import { CheckCircle2 } from "lucide-react";
import { eventMeta, formatDateTime, severityMeta } from "../constants/monitoring";

export default function EventTimeline({ events = [], onResolve }) {
  return (
    <section className="card timeline-card">
      <div className="section-heading">
        <div>
          <h2>Timeline de eventos</h2>
          <span>{events.length} registros recentes</span>
        </div>
      </div>
      <div className="timeline-list">
        {events.slice(0, 8).map((event) => {
          const meta = eventMeta(event.eventType);
          const severity = severityMeta(event.severity);
          const Icon = meta.icon;

          return (
            <article
              key={event.id}
              className={`timeline-item severity-${String(event.severity).toLowerCase()} ${event.resolved ? "timeline-resolved" : ""}`}
            >
              <div className={`timeline-icon timeline-icon-${meta.tone}`}>
                <Icon size={18} />
              </div>
              <div>
                <div className="timeline-title-row">
                  <strong>{meta.label}</strong>
                  <span className={`severity-pill severity-pill-${severity.tone}`}>{severity.label}</span>
                </div>
                <span>{formatDateTime(event.createdAt)}</span>
                <p>{event.message || meta.description}</p>
                <small>{event.resolved ? `Resolvido por ${event.resolvedBy || "responsavel"}` : "Aguardando atendimento"}</small>
              </div>
              <div className="timeline-actions">
                {!event.resolved ? (
                  <button className="button button-small" onClick={() => onResolve(event.id)}>
                    <CheckCircle2 size={15} />
                    Atendido
                  </button>
                ) : (
                  <span className="resolved-label">Resolvido</span>
                )}
              </div>
            </article>
          );
        })}
        {!events.length ? <p className="empty-state">Nenhum evento registrado.</p> : null}
      </div>
    </section>
  );
}
