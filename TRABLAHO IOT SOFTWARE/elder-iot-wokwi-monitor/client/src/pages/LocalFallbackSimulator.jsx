import { useEffect, useRef, useState } from "react";
import { Play, Send, Square } from "lucide-react";
import { api } from "../api/apiClient";

const modes = [
  { label: "Normal/parado", mode: "STANDING" },
  { label: "Caminhada", mode: "WALKING" },
  { label: "Impacto de queda", mode: "FALL_IMPACT" },
  { label: "Pos-queda", mode: "POST_FALL" },
  { label: "Inatividade", mode: "INACTIVE" },
  { label: "Bateria baixa", mode: "LOW_BATTERY" }
];

export default function LocalFallbackSimulator({ selectedElder }) {
  const [mode, setMode] = useState("STANDING");
  const [lastResult, setLastResult] = useState("");
  const intervalRef = useRef(null);

  async function send(selectedMode = mode) {
    const response = await api.sendLocalSimulation({
      elderId: selectedElder?.id || 1,
      mode: selectedMode
    });
    setLastResult(`${response.classification.eventType} | risco ${response.classification.riskScore}`);
  }

  function start() {
    if (intervalRef.current) {
      return;
    }
    send();
    intervalRef.current = setInterval(() => send(mode), 2000);
  }

  function stop() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <section className="card page-card">
      <div className="section-heading">
        <h2>Simulador local fallback</h2>
        <span>plano B</span>
      </div>
      <p className="body-copy">
        Este e um simulador local de fallback. O fluxo principal da apresentacao usa Wokwi + ESP32 + MPU6050.
      </p>

      <div className="scenario-buttons">
        {modes.map((item) => (
          <button
            key={item.mode}
            className={`scenario-button ${mode === item.mode ? "active" : ""}`}
            onClick={() => { setMode(item.mode); send(item.mode); }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="button-row">
        <button className="button" onClick={() => send()}><Send size={17} /> Enviar leitura</button>
        <button className="button button-secondary" onClick={start}><Play size={17} /> Envio automatico</button>
        <button className="button button-danger" onClick={stop}><Square size={17} /> Parar</button>
      </div>

      <div className="endpoint-box">
        <span>Ultimo resultado</span>
        <code>{lastResult || "Aguardando envio"}</code>
      </div>
    </section>
  );
}
