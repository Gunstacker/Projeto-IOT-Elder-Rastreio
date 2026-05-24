import {
  AlertTriangle,
  BatteryWarning,
  CheckCircle2,
  Clock3,
  MapPin,
  Radio,
  ShieldAlert,
  Wifi,
  WifiOff
} from "lucide-react";

export const STATUS_META = {
  NORMAL: { label: "Normal", tone: "normal" },
  WARNING: { label: "Atencao", tone: "warning" },
  EMERGENCY: { label: "Emergencia", tone: "emergency" },
  OFFLINE: { label: "Offline", tone: "offline" }
};

export const SEVERITY_META = {
  HIGH: { label: "Alta", tone: "emergency" },
  MEDIUM: { label: "Media", tone: "warning" },
  LOW: { label: "Baixa", tone: "normal" }
};

export const EVENT_META = {
  FALL_IMPACT_DETECTED: {
    label: "Impacto de queda",
    description: "Impacto compativel com queda",
    icon: ShieldAlert,
    tone: "emergency"
  },
  POST_FALL_INACTIVITY: {
    label: "Pos-queda",
    description: "Baixa movimentacao apos impacto",
    icon: AlertTriangle,
    tone: "emergency"
  },
  INACTIVITY: {
    label: "Inatividade",
    description: "Pouca movimentacao detectada",
    icon: Clock3,
    tone: "warning"
  },
  LOW_BATTERY: {
    label: "Bateria baixa",
    description: "Dispositivo precisa de recarga",
    icon: BatteryWarning,
    tone: "warning"
  },
  DEVICE_OFFLINE: {
    label: "Offline",
    description: "Dispositivo parou de transmitir",
    icon: WifiOff,
    tone: "offline"
  },
  DEVICE_ONLINE: {
    label: "Online",
    description: "Dispositivo voltou a transmitir",
    icon: Wifi,
    tone: "normal"
  },
  PHONE_GPS_UPDATED: {
    label: "GPS celular",
    description: "Localizacao atualizada",
    icon: MapPin,
    tone: "normal"
  }
};

export const DEVICE_HEALTH_META = {
  ONLINE: { label: "Online", icon: Radio, tone: "normal" },
  OFFLINE: { label: "Offline", icon: WifiOff, tone: "offline" }
};

export function eventMeta(type) {
  return EVENT_META[type] || {
    label: type || "Evento",
    description: "Evento do sistema",
    icon: CheckCircle2,
    tone: "normal"
  };
}

export function statusMeta(status) {
  return STATUS_META[String(status || "NORMAL").toUpperCase()] || STATUS_META.NORMAL;
}

export function severityMeta(severity) {
  return SEVERITY_META[String(severity || "LOW").toUpperCase()] || SEVERITY_META.LOW;
}

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "--";
}

export function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";
}
