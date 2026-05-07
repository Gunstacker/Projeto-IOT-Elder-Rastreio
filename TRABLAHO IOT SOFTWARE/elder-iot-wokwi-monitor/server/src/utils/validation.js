const { toIso } = require("./time");

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function requireNumber(value, fieldName, errors) {
  if (!isFiniteNumber(value)) {
    errors.push(`Payload invalido: ${fieldName} ausente ou invalido`);
  }
}

function validateReadingPayload(payload) {
  const errors = [];
  const mpu = payload?.sensors?.mpu6050;
  const acc = mpu?.accelerometer;
  const gyro = mpu?.gyroscope;
  const isPhone = String(payload?.deviceType || "").toUpperCase().includes("SMARTPHONE");

  if (!payload || typeof payload !== "object") {
    return ["Payload invalido: corpo JSON ausente"];
  }

  if (!payload.deviceId) {
    errors.push("Payload invalido: deviceId ausente");
  }

  if (!Number.isInteger(Number(payload.elderId))) {
    errors.push("Payload invalido: elderId ausente ou invalido");
  }

  if (!mpu) {
    errors.push("Payload invalido: MPU6050 ausente");
  }

  if (!acc) {
    errors.push("Payload invalido: acelerometro ausente");
  } else {
    requireNumber(acc.x, "accelerometer.x", errors);
    requireNumber(acc.y, "accelerometer.y", errors);
    requireNumber(acc.z, "accelerometer.z", errors);
  }

  if (!gyro) {
    errors.push("Payload invalido: giroscopio ausente");
  } else {
    requireNumber(gyro.x, "gyroscope.x", errors);
    requireNumber(gyro.y, "gyroscope.y", errors);
    requireNumber(gyro.z, "gyroscope.z", errors);
  }

  if (!payload.battery || (!isPhone && !isFiniteNumber(payload.battery.level))) {
    errors.push("Payload invalido: battery.level ausente ou invalido");
  }

  return errors;
}

function normalizeGyro(gyro) {
  const unit = String(gyro.unit || "deg/s").toLowerCase();
  const factor = unit === "rad/s" || unit === "radian/s" || unit === "radians/s" ? 57.2958 : 1;

  return {
    x: Number(gyro.x) * factor,
    y: Number(gyro.y) * factor,
    z: Number(gyro.z) * factor,
    unit: "deg/s"
  };
}

function normalizeReadingPayload(payload) {
  const mpu = payload.sensors.mpu6050;
  const gps = payload.sensors.gps || {};
  const batteryLevel = isFiniteNumber(payload.battery?.level)
    ? Math.max(0, Math.min(100, Math.round(Number(payload.battery.level))))
    : null;

  return {
    ...payload,
    elderId: Number(payload.elderId),
    timestamp: toIso(payload.timestamp),
    deviceType: payload.deviceType || "ESP32_WOKWI_SIMULATED",
    firmwareVersion: payload.firmwareVersion || "1.0.0",
    network: {
      ssid: payload.network?.ssid || "Wokwi-GUEST",
      rssi: Number.isFinite(payload.network?.rssi) ? payload.network.rssi : null,
      ip: payload.network?.ip || null,
      transport: payload.network?.transport || "HTTP"
    },
    battery: {
      level: batteryLevel,
      charging: Boolean(payload.battery.charging),
      voltage: isFiniteNumber(payload.battery.voltage) ? payload.battery.voltage : null
    },
    sensors: {
      mpu6050: {
        accelerometer: {
          x: Number(mpu.accelerometer.x),
          y: Number(mpu.accelerometer.y),
          z: Number(mpu.accelerometer.z),
          unit: "g"
        },
        gyroscope: normalizeGyro(mpu.gyroscope),
        temperature: Number.isFinite(mpu.temperature) ? mpu.temperature : null
      },
      gps: {
        latitude: Number.isFinite(gps.latitude) ? gps.latitude : null,
        longitude: Number.isFinite(gps.longitude) ? gps.longitude : null,
        accuracy: Number.isFinite(gps.accuracy) ? gps.accuracy : null,
        speed: Number.isFinite(gps.speed) ? gps.speed : null,
        source: gps.source || null
      }
    },
    simulation: {
      source: payload.simulation?.source || "UNKNOWN",
      mode: payload.simulation?.mode || "UNKNOWN",
      isSimulated: Boolean(payload.simulation?.isSimulated),
      scenario: payload.simulation?.scenario || "UNKNOWN"
    }
  };
}

module.exports = {
  validateReadingPayload,
  normalizeReadingPayload
};
