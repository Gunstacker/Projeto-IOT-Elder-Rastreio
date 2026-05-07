export default function ScenarioLegend() {
  return (
    <section className="card legend-card">
      <div className="section-heading">
        <h2>Comandos do Serial Monitor</h2>
        <span>Wokwi</span>
      </div>
      <div className="command-grid">
        <span><kbd>n</kbd> normal/parado</span>
        <span><kbd>w</kbd> caminhada</span>
        <span><kbd>s</kbd> sentado</span>
        <span><kbd>l</kbd> deitado</span>
        <span><kbd>f</kbd> queda completa</span>
        <span><kbd>i</kbd> inatividade</span>
        <span><kbd>b</kbd> bateria baixa</span>
        <span><kbd>o</kbd> perda de sinal</span>
        <span><kbd>r</kbd> reset normal</span>
      </div>
    </section>
  );
}
