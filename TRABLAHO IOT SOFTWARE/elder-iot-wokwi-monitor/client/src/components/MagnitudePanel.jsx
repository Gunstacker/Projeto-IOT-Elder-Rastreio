function format(number, suffix) {
  return Number.isFinite(number) ? `${Number(number).toFixed(2)} ${suffix}` : "--";
}

export default function MagnitudePanel({ reading }) {
  const acc = Number(reading?.accMagnitude);
  const gyro = Number(reading?.gyroMagnitude);

  return (
    <section className="card">
      <div className="section-heading">
        <h2>Magnitudes calculadas</h2>
        <span>backend</span>
      </div>
      <div className="magnitude-stack">
        <div>
          <span>Magnitude aceleracao</span>
          <strong>{format(acc, "g")}</strong>
          <progress max="10" value={Number.isFinite(acc) ? Math.min(acc, 10) : 0} />
        </div>
        <div>
          <span>Magnitude giroscopio</span>
          <strong>{format(gyro, "deg/s")}</strong>
          <progress max="220" value={Number.isFinite(gyro) ? Math.min(gyro, 220) : 0} />
        </div>
      </div>
      <div className="thresholds">
        <span>Celular: aceleracao forte + rotacao alta</span>
        <span>Wokwi/ESP32: impacto + rotacao alta</span>
      </div>
    </section>
  );
}
