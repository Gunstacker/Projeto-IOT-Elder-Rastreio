function value(number, suffix = "") {
  return Number.isFinite(number) ? `${Number(number).toFixed(2)}${suffix}` : "--";
}

export default function SensorPanel({ reading }) {
  const acc = {
    x: reading?.accX,
    y: reading?.accY,
    z: reading?.accZ
  };
  const gyro = {
    x: reading?.gyroX,
    y: reading?.gyroY,
    z: reading?.gyroZ
  };

  return (
    <section className="card">
      <div className="section-heading">
        <h2>Sensores MPU6050</h2>
        <span>{reading?.simulationMode || "--"}</span>
      </div>
      <div className="sensor-grid">
        <div>
          <h3>Acelerometro</h3>
          <dl className="metric-list">
            <div><dt>ax</dt><dd>{value(acc.x, " g")}</dd></div>
            <div><dt>ay</dt><dd>{value(acc.y, " g")}</dd></div>
            <div><dt>az</dt><dd>{value(acc.z, " g")}</dd></div>
          </dl>
        </div>
        <div>
          <h3>Giroscopio</h3>
          <dl className="metric-list">
            <div><dt>gx</dt><dd>{value(gyro.x, " deg/s")}</dd></div>
            <div><dt>gy</dt><dd>{value(gyro.y, " deg/s")}</dd></div>
            <div><dt>gz</dt><dd>{value(gyro.z, " deg/s")}</dd></div>
          </dl>
        </div>
      </div>
      <div className="data-strip">
        <span>Temperatura: {value(reading?.temperature, " C")}</span>
        <span>Cenario: {reading?.scenario || "--"}</span>
      </div>
    </section>
  );
}
