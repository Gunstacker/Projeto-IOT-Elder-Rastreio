import { useEffect, useState } from "react";
import { MailCheck, MailWarning, RefreshCw, RotateCcw } from "lucide-react";
import { api } from "../api/apiClient";
import { formatDateTime } from "../constants/monitoring";

const statusTone = {
  SENT: "normal",
  PENDING: "warning",
  SENDING: "warning",
  RETRYING: "warning",
  DRY_RUN: "warning",
  FAILED: "emergency",
  SKIPPED: "offline"
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await api.emailNotifications("?limit=100");
      setNotifications(response.data || []);
      setQueue(response.queue || null);
    } finally {
      setLoading(false);
    }
  }

  async function retry(id) {
    await api.retryEmailNotification(id);
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  const sentCount = notifications.filter((item) => item.status === "SENT").length;
  const failedCount = notifications.filter((item) => item.status === "FAILED").length;
  const dryRunCount = notifications.filter((item) => item.status === "DRY_RUN").length;
  const queueStatus = queue?.dryRun
    ? queue?.smtpConfigured ? "Modo teste ativo" : "SMTP nao configurado"
    : "SMTP ativo";

  return (
    <div className="page-stack">
      <section className="status-grid">
        <div className="card status-card tone-normal">
          <div className="card-title-row"><span>Enviados</span><MailCheck size={20} /></div>
          <strong>{sentCount}</strong>
          <p>Historico carregado</p>
        </div>
        <div className="card status-card tone-warning">
          <div className="card-title-row"><span>Fila</span><RefreshCw size={20} /></div>
          <strong>{queue?.queued ?? 0}</strong>
          <p>{queueStatus}</p>
        </div>
        <div className="card status-card tone-emergency">
          <div className="card-title-row"><span>Falhas</span><MailWarning size={20} /></div>
          <strong>{failedCount}</strong>
          <p>{dryRunCount ? `${dryRunCount} em modo teste` : "Com retry manual"}</p>
        </div>
      </section>

      {queue && !queue.readyForRealDelivery ? (
        <div className="inline-error">
          Envio real de e-mail desativado. Configure SMTP no server/.env e reinicie o backend.
        </div>
      ) : null}

      <section className="card page-card notifications-page">
        <div className="section-heading">
          <div>
            <h2>Notificacoes por e-mail</h2>
            <span>Historico de envio, tentativas e status</span>
          </div>
          <button className="button button-small" onClick={load} disabled={loading}>
            <RefreshCw size={15} />
            Atualizar
          </button>
        </div>

        <div className="notification-list">
          {notifications.map((item) => (
            <article key={item.id} className={`notification-row notification-row-${statusTone[item.status] || "offline"}`}>
              <div className="notification-icon">
                {item.status === "SENT" ? <MailCheck size={19} /> : <MailWarning size={19} />}
              </div>
              <div>
                <strong>{item.subject}</strong>
                <span>{item.elderName || item.elderId} | {item.recipientEmail || "sem e-mail"} | {formatDateTime(item.createdAt)}</span>
                <p>{item.errorMessage || item.body}</p>
              </div>
              <div className="notification-meta">
                <span className={`severity-pill severity-pill-${statusTone[item.status] || "offline"}`}>{item.status}</span>
                <span>{item.attempts} tentativa(s)</span>
                <span>{item.sentAt ? `Enviado ${formatDateTime(item.sentAt)}` : "Nao enviado"}</span>
              </div>
              <div className="event-row-action">
                {item.status === "FAILED" ? (
                  <button className="button button-small" onClick={() => retry(item.id)}>
                    <RotateCcw size={15} />
                    Reenviar
                  </button>
                ) : null}
              </div>
            </article>
          ))}
          {!notifications.length ? <p className="empty-state">Nenhuma notificacao enviada ainda.</p> : null}
        </div>
      </section>
    </div>
  );
}
