const eventLabels = {
  FALL_IMPACT_DETECTED: "Impacto de queda",
  POST_FALL_INACTIVITY: "Pos-queda",
  INACTIVITY: "Inatividade",
  LOW_BATTERY: "Bateria baixa",
  DEVICE_OFFLINE: "Offline",
  DEVICE_ONLINE: "Online",
  PHONE_GPS_UPDATED: "GPS celular"
};

export default function EventTimeline({ events = [], onResolve }) {
  return (
    <section className="card timeline-card">
      <div className="section-heading">
        <h2>Historico de eventos</h2>
        <span>{events.length} registros</span>
      </div>
      <div className="timeline-list">
        {events.slice(0, 8).map((event) => (
          <article key={event.id} className={`timeline-item severity-${String(event.severity).toLowerCase()}`}>
            <div>
              <strong>{eventLabels[event.eventType] || event.eventType}</strong>
              <span>{event.createdAt ? new Date(event.createdAt).toLocaleString() : "--"}</span>
              <p>{event.message}</p>
            </div>
            <div className="timeline-actions">
              <span>{event.severity}</span>
              {!event.resolved ? (
                <button className="button button-small" onClick={() => onResolve(event.id)}>
                  Atendido
                </button>
              ) : (
                <span className="resolved-label">Resolvido</span>
              )}
            </div>
          </article>
        ))}
        {!events.length ? <p className="empty-state">Nenhum evento registrado.</p> : null}
      </div>
    </section>
  );
}
