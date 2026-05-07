function calculateAccelerationMagnitude(acc) {
  return Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
}

function calculateGyroMagnitude(gyro) {
  return Math.sqrt(gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z);
}

function isLowMotion(accMagnitude, gyroMagnitude) {
  return gyroMagnitude < 1.0 && accMagnitude >= 0.8 && accMagnitude <= 1.2;
}

function isLikelyLying(acc) {
  const zIsLow = Math.abs(acc.z) < 0.6;
  const sideAxisHigh = Math.abs(acc.x) > 0.6 || Math.abs(acc.y) > 0.6;
  return zIsLow && sideAxisHigh;
}

const WOKWI_FALL_ACCELERATION_THRESHOLD = 6.0;
const WOKWI_FALL_COMBINED_ACCELERATION_THRESHOLD = 3.0;
const WOKWI_FALL_GYRO_THRESHOLD = 120;

const PHONE_FALL_ACCELERATION_THRESHOLD = 7.2;
const PHONE_FALL_GYRO_THRESHOLD = 140;
const PHONE_HARD_FALL_ACCELERATION_THRESHOLD = 9.5;
const PHONE_HARD_FALL_GYRO_THRESHOLD = 90;

function isFallImpact(accMagnitude, gyroMagnitude, isPhone) {
  if (isPhone) {
    return (
      (accMagnitude >= PHONE_FALL_ACCELERATION_THRESHOLD && gyroMagnitude >= PHONE_FALL_GYRO_THRESHOLD) ||
      (accMagnitude >= PHONE_HARD_FALL_ACCELERATION_THRESHOLD && gyroMagnitude >= PHONE_HARD_FALL_GYRO_THRESHOLD)
    );
  }

  return (
    accMagnitude >= WOKWI_FALL_ACCELERATION_THRESHOLD ||
    (accMagnitude >= WOKWI_FALL_COMBINED_ACCELERATION_THRESHOLD && gyroMagnitude >= WOKWI_FALL_GYRO_THRESHOLD)
  );
}

function classifyReading(reading, previousDeviceState = {}) {
  const acc = reading.sensors.mpu6050.accelerometer;
  const gyro = reading.sensors.mpu6050.gyroscope;
  const batteryLevel = reading.battery?.level ?? 100;
  const isPhone = String(reading.deviceType || "").toUpperCase().includes("SMARTPHONE");

  const accMagnitude = calculateAccelerationMagnitude(acc);
  const gyroMagnitude = calculateGyroMagnitude(gyro);
  const now = Date.now();
  const lastFallAt = previousDeviceState?.lastFallAt || previousDeviceState?.runtimeLastFallAt;
  const recentFall =
    lastFallAt && now - new Date(lastFallAt).getTime() <= 15000;
  const lowMotionStartedAt = previousDeviceState?.lowMotionStartedAt;
  const lowMotionDurationMs =
    lowMotionStartedAt && isLowMotion(accMagnitude, gyroMagnitude)
      ? now - new Date(lowMotionStartedAt).getTime()
      : 0;

  if (isFallImpact(accMagnitude, gyroMagnitude, isPhone)) {
    return {
      status: "EMERGENCY",
      eventType: "FALL_IMPACT_DETECTED",
      severity: "HIGH",
      riskScore: 95,
      accMagnitude,
      gyroMagnitude,
      message: "Impacto brusco compativel com possivel queda detectado."
    };
  }

  if (batteryLevel <= 15) {
    return {
      status: "WARNING",
      eventType: "LOW_BATTERY",
      severity: "LOW",
      riskScore: 35,
      accMagnitude,
      gyroMagnitude,
      message: "Bateria baixa no dispositivo ESP32 simulado."
    };
  }

  if (
    recentFall &&
    accMagnitude >= 0.7 &&
    accMagnitude <= 1.3 &&
    gyroMagnitude < 10 &&
    (isLikelyLying(acc) || gyroMagnitude < 2)
  ) {
    return {
      status: "EMERGENCY",
      eventType: "POST_FALL_INACTIVITY",
      severity: "HIGH",
      riskScore: 90,
      accMagnitude,
      gyroMagnitude,
      message: "Usuario permanece com baixa movimentacao apos possivel queda."
    };
  }

  if (lowMotionDurationMs >= 30000) {
    return {
      status: "WARNING",
      eventType: "INACTIVITY",
      severity: "MEDIUM",
      riskScore: 55,
      accMagnitude,
      gyroMagnitude,
      message: "Baixa movimentacao por mais de 30 segundos."
    };
  }

  if (isLowMotion(accMagnitude, gyroMagnitude)) {
    return {
      status: "NORMAL",
      eventType: "RESTING",
      severity: "LOW",
      riskScore: 10,
      accMagnitude,
      gyroMagnitude,
      message: "Usuario em repouso."
    };
  }

  if (gyroMagnitude >= 2.0 || reading.simulation?.mode === "WALKING") {
    return {
      status: "NORMAL",
      eventType: "WALKING",
      severity: "LOW",
      riskScore: 8,
      accMagnitude,
      gyroMagnitude,
      message: "Movimento compativel com caminhada ou atividade leve."
    };
  }

  return {
    status: "NORMAL",
    eventType: "NORMAL_READING",
    severity: "LOW",
    riskScore: 5,
    accMagnitude,
    gyroMagnitude,
    message: "Leitura dentro do padrao esperado."
  };
}

module.exports = {
  calculateAccelerationMagnitude,
  calculateGyroMagnitude,
  classifyReading,
  isLowMotion
};
