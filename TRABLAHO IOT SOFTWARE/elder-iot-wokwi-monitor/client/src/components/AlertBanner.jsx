import { CheckCircle, Siren, X } from "lucide-react";

export default function AlertBanner({ alert, onResolve, onDismiss }) {
  if (!alert) {
    return null;
  }

  return (
    <section className="emergency-banner">
      <div className="emergency-main">
        <Siren size={32} />
        <div>
          <strong>POSSIVEL QUEDA DETECTADA</strong>
          <p>
            Idoso: {alert.elderName} | Dispositivo: {alert.deviceId}
          </p>
          <p>{alert.message}</p>
          <p>
            Localizacao: {alert.latitude ?? "--"}, {alert.longitude ?? "--"} | Horario:{" "}
            {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString() : "--:--"}
          </p>
        </div>
      </div>
      <div className="banner-actions">
        {alert.eventId ? (
          <button className="button button-light" onClick={() => onResolve(alert.eventId)}>
            <CheckCircle size={17} />
            Marcar como atendido
          </button>
        ) : null}
        <button className="icon-button button-light" onClick={onDismiss} title="Fechar alerta">
          <X size={18} />
        </button>
      </div>
    </section>
  );
}
