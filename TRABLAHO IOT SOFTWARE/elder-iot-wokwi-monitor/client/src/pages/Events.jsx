import { useMemo, useState } from "react";
import { CheckCircle, RotateCw, Search } from "lucide-react";
import { api } from "../api/apiClient";
import { EVENT_META, eventMeta, formatDateTime, severityMeta } from "../constants/monitoring";

const severityOptions = [
  { label: "Todas", value: "" },
  { label: "Alta", value: "HIGH" },
  { label: "Media", value: "MEDIUM" },
  { label: "Baixa", value: "LOW" }
];

const resolvedOptions = [
  { label: "Todos", value: "" },
  { label: "Abertos", value: "false" },
  { label: "Resolvidos", value: "true" }
];

function buildQuery(filters) {
  const params = new URLSearchParams();
  params.set("limit", "100");

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return `?${params.toString()}`;
}

export default function Events({ events, setEvents, resolveEvent, elders = [] }) {
  const [filters, setFilters] = useState({
    severity: "",
    resolved: "",
    eventType: "",
    elderId: "",
    from: "",
    to: ""
  });
  const [loading, setLoading] = useState(false);

  async function loadFilter(nextFilters = filters) {
    setLoading(true);
    try {
      const response = await api.events(buildQuery(nextFilters));
      setEvents(response.data || []);
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(field, value) {
    const next = { ...filters, [field]: value };
    setFilters(next);
  }

  const rows = useMemo(() => events || [], [events]);

  return (
    <section className="card page-card events-page">
      <div className="section-heading">
        <div>
          <h2>Historico inteligente</h2>
          <span>{rows.length} eventos encontrados</span>
        </div>
        <div className="button-row">
          <button className="button button-secondary button-small" onClick={() => loadFilter()} disabled={loading}>
            <Search size={15} />
            Filtrar
          </button>
          <button className="button button-small" onClick={() => loadFilter()} disabled={loading}>
            <RotateCw size={15} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="filter-panel">
        <label>
          Gravidade
          <select value={filters.severity} onChange={(event) => updateFilter("severity", event.target.value)}>
            {severityOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={filters.resolved} onChange={(event) => updateFilter("resolved", event.target.value)}>
            {resolvedOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label>
          Tipo
          <select value={filters.eventType} onChange={(event) => updateFilter("eventType", event.target.value)}>
            <option value="">Todos</option>
            {Object.entries(EVENT_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select>
        </label>
        <label>
          Paciente
          <select value={filters.elderId} onChange={(event) => updateFilter("elderId", event.target.value)}>
            <option value="">Todos</option>
            {elders.map((elder) => <option key={elder.id} value={elder.id}>{elder.name}</option>)}
          </select>
        </label>
        <label>
          De
          <input type="datetime-local" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} />
        </label>
        <label>
          Ate
          <input type="datetime-local" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} />
        </label>
      </div>

      <div className="event-list">
        {rows.map((item) => {
          const meta = eventMeta(item.eventType);
          const severity = severityMeta(item.severity);
          const Icon = meta.icon;

          return (
            <article key={item.id} className={`event-row event-row-${severity.tone}`}>
              <div className={`event-row-icon timeline-icon-${meta.tone}`}>
                <Icon size={18} />
              </div>
              <div>
                <strong>{meta.label}</strong>
                <span>{formatDateTime(item.createdAt)} | {item.elderName || item.elderId}</span>
                <p>{item.message || meta.description}</p>
              </div>
              <div className="event-row-meta">
                <span className={`severity-pill severity-pill-${severity.tone}`}>{severity.label}</span>
                <span>{item.deviceId || "Celular"}</span>
                <span>{item.latitude ? `${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}` : "Sem GPS"}</span>
              </div>
              <div className="event-row-action">
                {!item.resolved ? (
                  <button className="button button-small" onClick={() => resolveEvent(item.id)}>
                    <CheckCircle size={15} />
                    Atender
                  </button>
                ) : (
                  <span className="resolved-label">Resolvido</span>
                )}
              </div>
            </article>
          );
        })}
        {!rows.length ? <p className="empty-state">Nenhum evento para o filtro atual.</p> : null}
      </div>
    </section>
  );
}
