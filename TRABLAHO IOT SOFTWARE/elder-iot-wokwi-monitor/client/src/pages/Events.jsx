import { useMemo, useState } from "react";
import { CheckCircle, RotateCw } from "lucide-react";
import { api } from "../api/apiClient";

const filters = [
  { label: "Todos", value: "" },
  { label: "Emergencia", value: "?severity=HIGH&limit=100" },
  { label: "Atencao", value: "?severity=MEDIUM&limit=100" },
  { label: "Baixo", value: "?severity=LOW&limit=100" },
  { label: "Nao resolvidos", value: "?resolved=false&limit=100" },
  { label: "Resolvidos", value: "?resolved=true&limit=100" }
];

export default function Events({ events, setEvents, resolveEvent }) {
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadFilter(query) {
    setActiveFilter(query);
    setLoading(true);
    try {
      const response = await api.events(query || "?limit=100");
      setEvents(response.data || []);
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => events || [], [events]);

  return (
    <section className="card page-card">
      <div className="section-heading">
        <h2>Eventos</h2>
        <button className="button button-small" onClick={() => loadFilter(activeFilter)} disabled={loading}>
          <RotateCw size={15} />
          Atualizar
        </button>
      </div>

      <div className="filter-row">
        {filters.map((filter) => (
          <button
            key={filter.label}
            className={`filter-button ${activeFilter === filter.value ? "active" : ""}`}
            onClick={() => loadFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Idoso</th>
              <th>Dispositivo</th>
              <th>Evento</th>
              <th>Status</th>
              <th>Gravidade</th>
              <th>Risk</th>
              <th>Mensagem</th>
              <th>Localizacao</th>
              <th>Resolvido</th>
              <th>Acao</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => (
              <tr key={event.id}>
                <td>{event.createdAt ? new Date(event.createdAt).toLocaleString() : "--"}</td>
                <td>{event.elderName || event.elderId}</td>
                <td>{event.deviceId || "Celular"}</td>
                <td>{event.eventType}</td>
                <td>{event.status}</td>
                <td>{event.severity}</td>
                <td>{event.riskScore ?? "--"}</td>
                <td>{event.message}</td>
                <td>{event.latitude ? `${Number(event.latitude).toFixed(5)}, ${Number(event.longitude).toFixed(5)}` : "--"}</td>
                <td>{event.resolved ? "Sim" : "Nao"}</td>
                <td>
                  {!event.resolved ? (
                    <button className="button button-small" onClick={() => resolveEvent(event.id)}>
                      <CheckCircle size={15} />
                      Atender
                    </button>
                  ) : (
                    event.resolvedBy || "--"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="empty-state">Nenhum evento para o filtro atual.</p> : null}
      </div>
    </section>
  );
}
