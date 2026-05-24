export default function StatusCard({ title, value, detail, tone = "normal", icon: Icon }) {
  return (
    <section className={`card status-card tone-${tone}`}>
      <div className="card-title-row">
        <span>{title}</span>
        {Icon ? <span className={`status-card-icon status-card-icon-${tone}`}><Icon size={20} /></span> : null}
      </div>
      <strong>{value ?? "--"}</strong>
      {detail ? <p>{detail}</p> : null}
    </section>
  );
}
