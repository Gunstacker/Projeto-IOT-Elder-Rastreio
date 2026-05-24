import { useEffect, useRef, useState } from "react";
import { Activity, BatteryWarning, Footprints, Play, Send, ShieldAlert, Square, UserRound } from "lucide-react";
import { api } from "../api/apiClient";
import { formatTime } from "../constants/monitoring";

const modes = [
  { label: "Normal", mode: "STANDING", icon: UserRound, tone: "normal" },
  { label: "Caminhada", mode: "WALKING", icon: Footprints, tone: "normal" },
  { label: "Impacto", mode: "FALL_IMPACT", icon: ShieldAlert, tone: "emergency" },
  { label: "Pos-queda", mode: "POST_FALL", icon: Activity, tone: "emergency" },
  { label: "Inatividade", mode: "INACTIVE", icon: Activity, tone: "warning" },
  { label: "Bateria baixa", mode: "LOW_BATTERY", icon: BatteryWarning, tone: "warning" }
];

export default function LocalFallbackSimulator({ selectedElder }) {
  const [mode, setMode] = useState("STANDING");
  const [lastResult, setLastResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [autoRunning, setAutoRunning] = useState(false);
  const intervalRef = useRef(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  async function send(selectedMode = modeRef.current) {
    const response = await api.sendLocalSimulation({
      elderId: selectedElder?.id || 1,
      mode: selectedMode
    });
    const result = {
      time: new Date().toISOString(),
      mode: selectedMode,
      eventType: response.classification.eventType,
      riskScore: response.classification.riskScore,
      status: response.classification.status
    };
    setLastResult(result);
    setLogs((current) => [result, ...current].slice(0, 8));
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    modeRef.current = nextMode;
    send(nextMode);
  }

  function start() {
    if (intervalRef.current) {
      return;
    }
    setAutoRunning(true);
    send();
    intervalRef.current = setInterval(() => send(modeRef.current), 2000);
  }

  function stop() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setAutoRunning(false);
  }

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div className="dashboard-grid top-grid simulator-page">
      <section className="card page-card">
        <div className="section-heading">
          <div>
            <h2>Simulador local</h2>
            <span>{autoRunning ? "envio automatico ativo" : "fallback pronto"}</span>
          </div>
          <span className={`status-chip status-chip-${autoRunning ? "normal" : "offline"}`}>
            {autoRunning ? "Rodando" : "Manual"}
          </span>
        </div>

        <div className="scenario-buttons scenario-buttons-rich">
          {modes.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.mode}
                className={`scenario-button scenario-button-${item.tone} ${mode === item.mode ? "active" : ""}`}
                onClick={() => selectMode(item.mode)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="button-row">
          <button className="button" onClick={() => send()}><Send size={17} /> Enviar leitura</button>
          <button className="button button-secondary" onClick={start}><Play size={17} /> Automatico</button>
          <button className="button button-danger" onClick={stop}><Square size={17} /> Parar</button>
        </div>

        <div className="endpoint-box result-box">
          <span>Ultimo resultado</span>
          <strong>{lastResult ? `${lastResult.eventType} | risco ${lastResult.riskScore}` : "Aguardando envio"}</strong>
          <code>{lastResult ? `${lastResult.status} - ${formatTime(lastResult.time)}` : "sem payload local"}</code>
        </div>
      </section>

      <section className="card page-card">
        <div className="section-heading">
          <div>
            <h2>Logs do simulador</h2>
            <span>Ultimos payloads locais</span>
          </div>
        </div>
        <div className="simulator-log-list">
          {logs.map((log) => (
            <article key={`${log.time}-${log.mode}`} className={`simulator-log simulator-log-${String(log.status).toLowerCase()}`}>
              <span>{formatTime(log.time)}</span>
              <strong>{log.mode}</strong>
              <small>{log.eventType} | risco {log.riskScore}</small>
            </article>
          ))}
          {!logs.length ? <p className="empty-state">Nenhum envio local realizado.</p> : null}
        </div>
      </section>
    </div>
  );
}
