import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "../api/apiClient";

const GRAVITY = 9.80665;
const SEND_INTERVAL_MS = 1000;
const PHONE_FALL_ACCELERATION_G = 7.2;
const PHONE_FALL_GYRO_DEG_S = 140;
const PHONE_HARD_FALL_ACCELERATION_G = 9.5;
const PHONE_HARD_FALL_GYRO_DEG_S = 90;
const FALL_PAYLOAD_ACCELERATION_G = 7.3;
const FALL_PAYLOAD_GYRO_DEG_S = 150;
const FALL_COOLDOWN_MS = 30000;
const FALL_CONFIRMATION_WINDOW_MS = 900;
const SENSOR_WARMUP_MS = 2500;

const pendingLocation = {
  latitude: null,
  longitude: null,
  accuracy: null,
  speed: 0,
  source: "GPS_PENDING"
};

const restingMotion = {
  acc: { x: 0.02, y: 0.01, z: 1 },
  gyro: { x: 0.2, y: 0.1, z: 0.1 },
  accMagnitude: 1,
  gyroMagnitude: 0.24,
  source: "AWAITING_SENSOR"
};

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function magnitude(vector) {
  return Math.sqrt(
    vector.x * vector.x +
    vector.y * vector.y +
    vector.z * vector.z
  );
}

function vectorWithMinimumMagnitude(vector, minimum, fallback) {
  const currentMagnitude = magnitude(vector);
  const base = currentMagnitude > 0.01 ? vector : fallback;
  const baseMagnitude = magnitude(base) || 1;
  const scale = Math.max(1, minimum / baseMagnitude);

  return {
    x: round(base.x * scale),
    y: round(base.y * scale),
    z: round(base.z * scale)
  };
}

function motionFromEvent(event, previousMotion) {
  const acceleration = event.accelerationIncludingGravity || event.acceleration;
  const rotation = event.rotationRate;
  const accValues = {
    x: finiteNumber(acceleration?.x),
    y: finiteNumber(acceleration?.y),
    z: finiteNumber(acceleration?.z)
  };
  const gyroValues = {
    x: finiteNumber(rotation?.beta),
    y: finiteNumber(rotation?.gamma),
    z: finiteNumber(rotation?.alpha)
  };
  const hasAcceleration = Object.values(accValues).some((value) => value !== null);
  const hasGyro = Object.values(gyroValues).some((value) => value !== null);

  if (!hasAcceleration && !hasGyro) {
    return null;
  }

  const acc = {
    x: hasAcceleration && accValues.x !== null ? round(accValues.x / GRAVITY) : previousMotion.acc.x,
    y: hasAcceleration && accValues.y !== null ? round(accValues.y / GRAVITY) : previousMotion.acc.y,
    z: hasAcceleration && accValues.z !== null ? round(accValues.z / GRAVITY) : previousMotion.acc.z
  };
  const gyro = {
    x: hasGyro && gyroValues.x !== null ? round(gyroValues.x, 2) : previousMotion.gyro.x,
    y: hasGyro && gyroValues.y !== null ? round(gyroValues.y, 2) : previousMotion.gyro.y,
    z: hasGyro && gyroValues.z !== null ? round(gyroValues.z, 2) : previousMotion.gyro.z
  };

  return {
    acc,
    gyro,
    accMagnitude: magnitude(acc),
    gyroMagnitude: magnitude(gyro),
    source: "PHONE_SENSOR"
  };
}

function getStoredBattery() {
  try {
    const level = Number(window.localStorage.getItem("phoneBatteryLevel"));
    if (Number.isFinite(level) && level >= 0 && level <= 100) {
      return { level, charging: false, voltage: null };
    }
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }

  return { level: null, charging: false, voltage: null };
}

function modeForMotion(motion, fallPending) {
  if (fallPending) {
    return "FALL_IMPACT";
  }

  if (motion.accMagnitude > 1.25 || motion.gyroMagnitude > 8) {
    return "WALKING";
  }

  return "STANDING";
}

function isFallImpactCandidate(motion) {
  return (
    (
      motion.accMagnitude >= PHONE_FALL_ACCELERATION_G &&
      motion.gyroMagnitude >= PHONE_FALL_GYRO_DEG_S
    ) ||
    (
      motion.accMagnitude >= PHONE_HARD_FALL_ACCELERATION_G &&
      motion.gyroMagnitude >= PHONE_HARD_FALL_GYRO_DEG_S
    )
  );
}

function getPhoneDeviceId() {
  const suffix = window.crypto?.randomUUID
    ? window.crypto.randomUUID().slice(0, 8).toUpperCase()
    : String(Date.now()).slice(-8);

  try {
    const existing = window.localStorage.getItem("phoneDeviceId");
    if (existing) {
      return existing;
    }

    const deviceId = `PHONE_${suffix}`;
    window.localStorage.setItem("phoneDeviceId", deviceId);
    return deviceId;
  } catch {
    return `PHONE_${suffix}`;
  }
}

export default function PhoneGps({ setElders, setDevices }) {
  const [gps, setGps] = useState(pendingLocation);
  const [motion, setMotion] = useState(restingMotion);
  const [status, setStatus] = useState("Conectando celular ao monitoramento");
  const [lastResponse, setLastResponse] = useState("");
  const [monitoring, setMonitoring] = useState(false);
  const [permissionNeeded, setPermissionNeeded] = useState(false);
  const [fallPending, setFallPending] = useState(false);
  const [registeredElder, setRegisteredElder] = useState(null);
  const [registeredDevice, setRegisteredDevice] = useState(null);

  const phoneDeviceIdRef = useRef(getPhoneDeviceId());
  const gpsRef = useRef(pendingLocation);
  const motionRef = useRef(restingMotion);
  const batteryRef = useRef(getStoredBattery());
  const intervalRef = useRef(null);
  const gpsWatchRef = useRef(null);
  const lastFallAtRef = useRef(0);
  const lastFallImpactCandidateAtRef = useRef(0);
  const fallPendingRef = useRef(false);
  const sendingRef = useRef(false);
  const motionListenerRef = useRef(null);
  const registeredElderRef = useRef(null);
  const monitoringActiveRef = useRef(false);
  const motionStartedAtRef = useRef(0);

  function mergeById(setter, item) {
    if (!setter || !item?.id) {
      return;
    }

    setter((current) => {
      const exists = current.some((existing) => existing.id === item.id);
      return exists
        ? current.map((existing) => (existing.id === item.id ? item : existing))
        : [...current, item];
    });
  }

  function mergeDevice(device) {
    if (!setDevices || !device?.deviceId) {
      return;
    }

    setDevices((current) => {
      const exists = current.some((item) => item.deviceId === device.deviceId);
      return exists
        ? current.map((item) => (item.deviceId === device.deviceId ? { ...item, ...device } : item))
        : [device, ...current];
    });
  }

  function updateGps(nextGps) {
    gpsRef.current = nextGps;
    setGps(nextGps);
  }

  function updateMotion(nextMotion) {
    motionRef.current = nextMotion;
    setMotion(nextMotion);
  }

  function markFallPending() {
    const now = Date.now();
    if (now - lastFallAtRef.current < FALL_COOLDOWN_MS) {
      return;
    }

    lastFallAtRef.current = now;
    fallPendingRef.current = true;
    setFallPending(true);
    setStatus("Impacto detectado. Enviando alerta de queda automaticamente.");
  }

  function handleMotionEvent(event) {
    const nextMotion = motionFromEvent(event, motionRef.current);
    if (!nextMotion) {
      return;
    }

    updateMotion(nextMotion);

    const now = Date.now();
    if (motionStartedAtRef.current && now - motionStartedAtRef.current < SENSOR_WARMUP_MS) {
      lastFallImpactCandidateAtRef.current = 0;
      return;
    }

    if (!isFallImpactCandidate(nextMotion)) {
      lastFallImpactCandidateAtRef.current = 0;
      return;
    }

    const confirmed =
      lastFallImpactCandidateAtRef.current &&
      now - lastFallImpactCandidateAtRef.current <= FALL_CONFIRMATION_WINDOW_MS;
    lastFallImpactCandidateAtRef.current = now;

    if (confirmed) {
      markFallPending();
    }
  }

  function startGpsWatch() {
    if (!navigator.geolocation || gpsWatchRef.current !== null) {
      if (!navigator.geolocation) {
        setStatus("GPS real indisponivel neste navegador.");
      }
      return;
    }

    const onGpsSuccess = (position) => {
      updateGps({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: Number.isFinite(position.coords.speed) ? position.coords.speed : 0,
        source: "PHONE_REAL_GPS"
      });
      setStatus("GPS real ativo. Enviando localizacao do celular.");
    };
    const onGpsError = (error) => {
      const reason = error?.code === 1
        ? "permissao negada"
        : "indisponivel";
      updateGps({
        ...gpsRef.current,
        source: "GPS_BLOCKED"
      });
      setStatus(`GPS real ${reason}. Abra por HTTPS e permita localizacao.`);
    };

    navigator.geolocation.getCurrentPosition(
      onGpsSuccess,
      onGpsError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000
      }
    );

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      onGpsSuccess,
      onGpsError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000
      }
    );
  }

  async function startMotionListener() {
    if (motionListenerRef.current) {
      return true;
    }

    if (typeof window.DeviceMotionEvent === "undefined") {
      setStatus("Sensor de movimento indisponivel neste navegador.");
      return false;
    }

    if (typeof window.DeviceMotionEvent.requestPermission === "function") {
      try {
        const permission = await window.DeviceMotionEvent.requestPermission();
        if (permission !== "granted") {
          setPermissionNeeded(true);
          setStatus("Permissao de movimento pendente no celular.");
          return false;
        }
      } catch {
        setPermissionNeeded(true);
        setStatus("Toque em liberar sensores no celular antes da apresentacao.");
        return false;
      }
    }

    motionListenerRef.current = handleMotionEvent;
    window.addEventListener("devicemotion", motionListenerRef.current);
    motionStartedAtRef.current = Date.now();
    setPermissionNeeded(false);
    return true;
  }

  function stopMotionListener() {
    if (motionListenerRef.current) {
      window.removeEventListener("devicemotion", motionListenerRef.current);
      motionListenerRef.current = null;
    }
  }

  const registerPhone = useCallback(async () => {
    if (registeredElderRef.current) {
      return registeredElderRef.current;
    }

    const battery = batteryRef.current;
    const response = await api.registerPhone({
      deviceId: phoneDeviceIdRef.current,
      elderName: "Celular conectado",
      batteryLevel: battery.level,
      batteryVoltage: battery.voltage,
      rssi: -45
    });
    const elder = response.data.elder;
    const device = response.data.device;

    registeredElderRef.current = elder;
    setRegisteredElder(elder);
    setRegisteredDevice(device);
    mergeById(setElders, elder);
    mergeDevice(device);
    setStatus("Celular conectado e enviando dados.");

    return elder;
  }, [setDevices, setElders]);

  const sendReading = useCallback(async () => {
    if (sendingRef.current) {
      return;
    }

    sendingRef.current = true;

    try {
      const elder = await registerPhone();
      const currentGps = gpsRef.current;
      const currentMotion = motionRef.current;
      const shouldSendFall = fallPendingRef.current;
      const mode = modeForMotion(currentMotion, shouldSendFall);
      const acc = shouldSendFall
        ? vectorWithMinimumMagnitude(currentMotion.acc, FALL_PAYLOAD_ACCELERATION_G, { x: 5.8, y: 3.1, z: 3.2 })
        : currentMotion.acc;
      const gyro = shouldSendFall
        ? vectorWithMinimumMagnitude(currentMotion.gyro, FALL_PAYLOAD_GYRO_DEG_S, { x: 180, y: 95, z: 40 })
        : currentMotion.gyro;

      const response = await api.sendPhoneSensorReading({
        deviceId: phoneDeviceIdRef.current,
        deviceType: "SMARTPHONE_BROWSER",
        firmwareVersion: "phone-web-1.0.0",
        elderId: elder.id,
        timestamp: new Date().toISOString(),
        uptimeMs: Date.now(),
        network: {
          ssid: "PHONE_BROWSER",
          rssi: -45,
          ip: null,
          transport: "PHONE_WEB"
        },
        battery: batteryRef.current,
        sensors: {
          mpu6050: {
            accelerometer: { ...acc, unit: "g" },
            gyroscope: { ...gyro, unit: "deg/s" },
            temperature: null
          },
          gps: {
            latitude: Number.isFinite(currentGps.latitude) ? currentGps.latitude : null,
            longitude: Number.isFinite(currentGps.longitude) ? currentGps.longitude : null,
            accuracy: Number.isFinite(currentGps.accuracy) ? currentGps.accuracy : null,
            speed: currentGps.speed || 0,
            source: currentGps.source
          }
        },
        simulation: {
          source: "PHONE_SENSOR",
          mode,
          isSimulated: currentMotion.source !== "PHONE_SENSOR",
          scenario: shouldSendFall ? "PHONE_FALL_IMPACT" : "PHONE_MONITORING"
        }
      });

      setLastResponse(`${response.classification.eventType} | risco ${response.classification.riskScore}`);
      setStatus(shouldSendFall ? "Alerta de queda enviado automaticamente." : "Monitorando e enviando dados.");
      setRegisteredDevice(response.device);
      mergeById(setElders, response.elder);
      mergeDevice(response.device);

      if (shouldSendFall) {
        fallPendingRef.current = false;
        setFallPending(false);
      }
    } catch (error) {
      setStatus(error.message || "Falha ao enviar dados do celular.");
    } finally {
      sendingRef.current = false;
    }
  }, [registerPhone, setDevices, setElders]);

  async function startMonitoring() {
    if (intervalRef.current || monitoringActiveRef.current) {
      return;
    }

    monitoringActiveRef.current = true;
    await registerPhone();
    startGpsWatch();
    await startMotionListener();
    await sendReading();

    if (!monitoringActiveRef.current) {
      return;
    }

    intervalRef.current = setInterval(sendReading, SEND_INTERVAL_MS);
    setMonitoring(true);
  }

  function stopMonitoring() {
    monitoringActiveRef.current = false;
    clearInterval(intervalRef.current);
    intervalRef.current = null;

    if (gpsWatchRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }

    stopMotionListener();
    setMonitoring(false);
    setStatus("Monitoramento pausado.");
  }

  async function unlockSensors() {
    await startMotionListener();
    if (!intervalRef.current) {
      await startMonitoring();
    }
  }

  useEffect(() => {
    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        function updateBattery() {
          const nextLevel = Math.round(battery.level * 100);
          if (!Number.isFinite(nextLevel) || nextLevel < 0 || nextLevel > 100) {
            return;
          }

          batteryRef.current = {
            level: nextLevel,
            charging: battery.charging,
            voltage: null
          };

          try {
            window.localStorage.setItem("phoneBatteryLevel", String(nextLevel));
          } catch {
            // localStorage can be unavailable in restricted browser contexts.
          }
        }

        updateBattery();
        battery.addEventListener("levelchange", updateBattery);
        battery.addEventListener("chargingchange", updateBattery);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    startMonitoring();
    return stopMonitoring;
  }, []);

  return (
    <section className="card phone-card">
      <div className="section-heading">
        <h2>Celular do idoso</h2>
        <span>{registeredElder?.name || "Conectando"} | {monitoring ? "online" : "pausado"}</span>
      </div>

      <dl className="detail-list">
        <div><dt>Dispositivo</dt><dd>{registeredDevice?.deviceId || phoneDeviceIdRef.current}</dd></div>
        <div><dt>Status</dt><dd>{status}</dd></div>
        <div><dt>Fonte GPS</dt><dd>{gps.source}</dd></div>
        <div><dt>Latitude</dt><dd>{Number.isFinite(gps.latitude) ? gps.latitude.toFixed(6) : "--"}</dd></div>
        <div><dt>Longitude</dt><dd>{Number.isFinite(gps.longitude) ? gps.longitude.toFixed(6) : "--"}</dd></div>
        <div><dt>Precisao</dt><dd>{Number.isFinite(gps.accuracy) ? `${Math.round(gps.accuracy)} m` : "--"}</dd></div>
        <div><dt>Aceleracao</dt><dd>{motion.accMagnitude.toFixed(2)} g</dd></div>
        <div><dt>Rotacao</dt><dd>{motion.gyroMagnitude.toFixed(0)} deg/s</dd></div>
        <div><dt>Ultimo envio</dt><dd>{lastResponse || "--"}</dd></div>
      </dl>

      {permissionNeeded ? (
        <div className="button-row">
          <button className="button" onClick={unlockSensors}>
            <ShieldCheck size={17} /> Liberar sensores
          </button>
        </div>
      ) : null}
    </section>
  );
}
