import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import ConnectionHelp from "../components/ConnectionHelp";
import ScenarioLegend from "../components/ScenarioLegend";

export default function WokwiSetup() {
  const [ngrokUrl, setNgrokUrl] = useState("https://SEU-NGROK.ngrok-free.app");
  const endpoint = useMemo(() => `${ngrokUrl.replace(/\/$/, "")}/api/iot/readings`, [ngrokUrl]);

  async function copyEndpoint() {
    await navigator.clipboard?.writeText(endpoint);
  }

  return (
    <div className="page-stack">
      <div className="dashboard-grid top-grid">
        <ConnectionHelp ngrokUrl={ngrokUrl} />
        <ScenarioLegend />
      </div>

      <section className="card page-card">
        <div className="section-heading">
          <h2>URL atual do ngrok</h2>
          <span>cole no sketch.ino</span>
        </div>
        <div className="endpoint-editor">
          <input value={ngrokUrl} onChange={(event) => setNgrokUrl(event.target.value)} />
          <button className="button" onClick={copyEndpoint}>
            <Copy size={17} />
            Copiar endpoint
          </button>
        </div>
        <pre className="code-block">{`const char* API_URL = "${endpoint}";`}</pre>
      </section>

      <section className="card page-card">
        <div className="section-heading">
          <h2>Por que usar ngrok</h2>
          <span>rede publica temporaria</span>
        </div>
        <p className="body-copy">
          O Wokwi acessa a internet, mas normalmente nao acessa diretamente o localhost do notebook.
          O ngrok cria uma URL publica HTTPS que encaminha as requisicoes para http://localhost:3000.
        </p>
      </section>
    </div>
  );
}
