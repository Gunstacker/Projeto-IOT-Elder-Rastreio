export default function ReadingTable({ readings = [] }) {
  return (
    <section className="card table-card">
      <div className="section-heading">
        <h2>Ultimas leituras</h2>
        <span>{readings.length} amostras</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Evento</th>
              <th>Acc</th>
              <th>Gyro</th>
              <th>Bateria</th>
            </tr>
          </thead>
          <tbody>
            {readings.slice(0, 12).map((reading) => (
              <tr key={reading.id}>
                <td>{reading.createdAt ? new Date(reading.createdAt).toLocaleTimeString() : "--"}</td>
                <td>{reading.eventType}</td>
                <td>{Number(reading.accMagnitude || 0).toFixed(2)}g</td>
                <td>{Number(reading.gyroMagnitude || 0).toFixed(1)}</td>
                <td>{reading.batteryLevel ?? "--"}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!readings.length ? <p className="empty-state">Aguardando leituras do Wokwi ou simulador local.</p> : null}
      </div>
    </section>
  );
}
