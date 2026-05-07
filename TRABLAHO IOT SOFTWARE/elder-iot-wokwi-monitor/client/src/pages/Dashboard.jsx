import { AlertTriangle, Battery, HeartPulse, ShieldCheck } from "lucide-react";
import AlertBanner from "../components/AlertBanner";
import DeviceStatusCard from "../components/DeviceStatusCard";
import ElderProfileCard from "../components/ElderProfileCard";
import EventTimeline from "../components/EventTimeline";
import MagnitudePanel from "../components/MagnitudePanel";
import MapView from "../components/MapView";
import ReadingTable from "../components/ReadingTable";
import SensorPanel from "../components/SensorPanel";
import StatusCard from "../components/StatusCard";

function toneForStatus(status) {
  const upper = String(status || "NORMAL").toUpperCase();
  if (upper === "EMERGENCY") return "emergency";
  if (upper === "WARNING") return "warning";
  if (upper === "OFFLINE") return "offline";
  return "normal";
}

export default function Dashboard({
  selectedElder,
  selectedDevice,
  latestReading,
  readings,
  events,
  emergencyAlert,
  setEmergencyAlert,
  resolveEvent
}) {
  const currentStatus = latestReading?.classificationStatus || selectedElder?.currentStatus || "NORMAL";
  const source = String(latestReading?.source || selectedDevice?.deviceType || "").toUpperCase();
  const phoneIsSource = source.includes("PHONE") || source.includes("SMARTPHONE");

  return (
    <div className="page-stack">
      <AlertBanner
        alert={emergencyAlert}
        onResolve={resolveEvent}
        onDismiss={() => setEmergencyAlert(null)}
      />

      <div className="status-grid">
        <StatusCard
          title="Status atual"
          value={currentStatus}
          detail={latestReading?.eventType || "Aguardando leituras"}
          tone={toneForStatus(currentStatus)}
          icon={ShieldCheck}
        />
        <StatusCard
          title="Risk score"
          value={latestReading?.riskScore ?? 0}
          detail={latestReading?.severity || "LOW"}
          tone={toneForStatus(currentStatus)}
          icon={AlertTriangle}
        />
        <StatusCard
          title="Bateria"
          value={`${selectedDevice?.batteryLevel ?? latestReading?.batteryLevel ?? "--"}%`}
          detail={selectedDevice?.batteryVoltage ? `${selectedDevice.batteryVoltage} V` : "Aguardando dispositivo"}
          tone={(selectedDevice?.batteryLevel ?? 100) <= 15 ? "warning" : "normal"}
          icon={Battery}
        />
        <StatusCard
          title="Fonte principal"
          value={phoneIsSource ? "Celular" : "Dispositivo"}
          detail={phoneIsSource ? "GPS + movimento do telefone" : "Monitoramento em tempo real"}
          tone="normal"
          icon={HeartPulse}
        />
      </div>

      <div className="dashboard-grid top-grid">
        <ElderProfileCard elder={selectedElder} />
        <DeviceStatusCard device={selectedDevice} />
      </div>

      <div className="dashboard-grid middle-grid">
        <SensorPanel reading={latestReading} />
        <MagnitudePanel reading={latestReading} />
        <MapView elder={selectedElder} />
      </div>

      <div className="dashboard-grid bottom-grid">
        <EventTimeline events={events} onResolve={resolveEvent} />
        <ReadingTable readings={readings} />
      </div>
    </div>
  );
}
