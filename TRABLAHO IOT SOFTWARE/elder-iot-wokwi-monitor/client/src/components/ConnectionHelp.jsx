export default function ConnectionHelp({ ngrokUrl = "https://SEU-NGROK.ngrok-free.app" }) {
  const endpoint = `${ngrokUrl.replace(/\/$/, "")}/api/iot/readings`;

  return (
    <section className="card help-card">
      <div className="section-heading">
        <h2>Fluxo Wokwi + ngrok</h2>
        <span>modo principal</span>
      </div>
      <ol className="step-list">
        <li>Rode o backend: npm run dev:server</li>
        <li>Rode o frontend: npm run dev:client</li>
        <li>Rode o ngrok: ngrok http 3000</li>
        <li>Copie a URL HTTPS do ngrok</li>
        <li>Cole a URL no sketch.ino do Wokwi</li>
        <li>Inicie a simulacao no Wokwi</li>
        <li>Abra o dashboard</li>
      </ol>
      <div className="endpoint-box">
        <span>Endpoint final</span>
        <code>{endpoint}</code>
      </div>
    </section>
  );
}
