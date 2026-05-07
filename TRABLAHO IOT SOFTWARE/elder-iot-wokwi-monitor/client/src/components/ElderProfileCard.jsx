export default function ElderProfileCard({ elder }) {
  return (
    <section className="card">
      <div className="section-heading">
        <h2>Idoso monitorado</h2>
        <span className={`status-dot status-${String(elder?.currentStatus || "NORMAL").toLowerCase()}`}>
          {elder?.currentStatus || "NORMAL"}
        </span>
      </div>
      <dl className="detail-list">
        <div><dt>Nome</dt><dd>{elder?.name || "--"}</dd></div>
        <div><dt>Idade</dt><dd>{elder?.age ?? "--"}</dd></div>
        <div><dt>Responsavel</dt><dd>{elder?.responsibleName || "--"}</dd></div>
        <div><dt>Contato</dt><dd>{elder?.responsiblePhone || elder?.emergencyContact || "--"}</dd></div>
        <div><dt>Obs. medicas</dt><dd>{elder?.medicalNotes || "--"}</dd></div>
        <div><dt>Ultima atualizacao</dt><dd>{elder?.lastSeenAt ? new Date(elder.lastSeenAt).toLocaleString() : "--"}</dd></div>
      </dl>
    </section>
  );
}
