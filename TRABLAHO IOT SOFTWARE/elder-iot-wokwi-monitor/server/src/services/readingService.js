const { all, get, query } = require("../db");
const { nowIso } = require("../utils/time");
const { validateReadingPayload, normalizeReadingPayload } = require("../utils/validation");
const { classifyReading, isLowMotion } = require("./sensorClassifier");
const deviceService = require("./deviceService");
const eventService = require("./eventService");

const runtimeStateByDevice = new Map();

function getRuntimeState(deviceId) {
  return runtimeStateByDevice.get(deviceId) || {};
}

function updateRuntimeState(deviceId, reading, classification) {
  const state = getRuntimeState(deviceId);
  const now = nowIso();
  const lowMotion = isLowMotion(classification.accMagnitude, classification.gyroMagnitude);

  const nextState = {
    ...state,
    lowMotionStartedAt: lowMotion ? state.lowMotionStartedAt || now : null,
    runtimeLastFallAt:
      classification.eventType === "FALL_IMPACT_DETECTED"
        ? now
        : state.runtimeLastFallAt
  };

  runtimeStateByDevice.set(deviceId, nextState);
}

async function insertReading(reading, classification) {
  const mpu = reading.sensors.mpu6050;
  const gps = reading.sensors.gps || {};
  const createdAt = nowIso();

  const result = await query(`
    INSERT INTO readings (
      "deviceId", "elderId", timestamp, source, "simulationMode", scenario,
      "accX", "accY", "accZ", "gyroX", "gyroY", "gyroZ", "accMagnitude", "gyroMagnitude",
      temperature, "batteryLevel", "batteryVoltage", latitude, longitude,
      "gpsAccuracy", "gpsSource", rssi, "classificationStatus", "eventType",
      severity, "riskScore", "rawJson", "createdAt"
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12, $13,
      $14, $15, $16, $17,
      $18, $19, $20, $21, $22,
      $23, $24, $25, $26,
      $27, $28
    )
    RETURNING id
  `, [
    reading.deviceId,
    reading.elderId,
    reading.timestamp,
    reading.simulation?.source || "UNKNOWN",
    reading.simulation?.mode || "UNKNOWN",
    reading.simulation?.scenario || "UNKNOWN",
    mpu.accelerometer.x,
    mpu.accelerometer.y,
    mpu.accelerometer.z,
    mpu.gyroscope.x,
    mpu.gyroscope.y,
    mpu.gyroscope.z,
    classification.accMagnitude,
    classification.gyroMagnitude,
    mpu.temperature,
    reading.battery.level,
    reading.battery.voltage,
    gps.latitude,
    gps.longitude,
    gps.accuracy,
    gps.source,
    reading.network.rssi,
    classification.status,
    classification.eventType,
    classification.severity,
    classification.riskScore,
    JSON.stringify(reading),
    createdAt
  ]);

  return getReadingById(result.rows[0].id);
}

async function getReadingById(id) {
  return get("SELECT * FROM readings WHERE id = $1", [Number(id)]);
}

async function listReadings(filters = {}) {
  const where = [];
  const params = [];

  if (filters.elderId) {
    params.push(Number(filters.elderId));
    where.push(`"elderId" = $${params.length}`);
  }

  if (filters.deviceId) {
    params.push(String(filters.deviceId));
    where.push(`"deviceId" = $${params.length}`);
  }

  const limit = Math.max(1, Math.min(500, Number(filters.limit || 100)));
  params.push(limit);
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return all(`
    SELECT *
    FROM readings
    ${whereSql}
    ORDER BY "createdAt" DESC
    LIMIT $${params.length}
  `, params);
}

function emitReadingSideEffects(io, readingRow, reading, classification, deviceResult, elder, event) {
  io.emit("reading:new", readingRow);
  io.emit("device:status", deviceResult.current);
  io.emit("elder:status", elder);

  const gps = reading.sensors.gps || {};
  if (gps.latitude !== null && gps.longitude !== null) {
    io.emit("location:updated", {
      elderId: reading.elderId,
      latitude: gps.latitude,
      longitude: gps.longitude,
      accuracy: gps.accuracy,
      source: gps.source,
      createdAt: readingRow.createdAt
    });
  }

  if (event) {
    io.emit("event:new", event);
  }

  if (classification.status === "EMERGENCY") {
    io.emit("alert:emergency", {
      eventId: event?.id || null,
      elderId: elder.id,
      elderName: elder.name,
      deviceId: reading.deviceId,
      eventType: classification.eventType,
      severity: classification.severity,
      message: classification.message,
      latitude: gps.latitude,
      longitude: gps.longitude,
      createdAt: event?.createdAt || readingRow.createdAt
    });
  }
}

async function processIncomingReading(payload, io) {
  const errors = validateReadingPayload(payload);
  if (errors.length) {
    const error = new Error(errors[0]);
    error.statusCode = 400;
    throw error;
  }

  const reading = normalizeReadingPayload(payload);
  const previousDevice = await deviceService.ensureDeviceForReading(reading);
  const runtimeState = getRuntimeState(reading.deviceId);
  const classification = classifyReading(reading, {
    ...previousDevice,
    ...runtimeState
  });

  const readingRow = await insertReading(reading, classification);
  const deviceResult = await deviceService.updateDeviceAfterReading(reading, classification);
  const elder = await deviceService.updateElderFromReading(reading, classification);
  updateRuntimeState(reading.deviceId, reading, classification);

  const gps = reading.sensors.gps || {};
  const events = [];

  if (deviceResult.cameOnline) {
    const onlineEvent = await eventService.createEventIfAllowed({
      elderId: reading.elderId,
      deviceId: reading.deviceId,
      eventType: "DEVICE_ONLINE",
      status: "NORMAL",
      severity: "LOW",
      riskScore: 5,
      message: "Dispositivo voltou a enviar dados.",
      latitude: gps.latitude,
      longitude: gps.longitude,
      source: reading.simulation?.source || "DEVICE"
    });

    if (onlineEvent) {
      events.push(onlineEvent);
    }
  }

  const event = await eventService.createEventIfAllowed({
    elderId: reading.elderId,
    deviceId: reading.deviceId,
    eventType: classification.eventType,
    status: classification.status,
    severity: classification.severity,
    riskScore: classification.riskScore,
    message: classification.message,
    latitude: gps.latitude,
    longitude: gps.longitude,
    source: reading.simulation?.source || "DEVICE"
  });

  if (event) {
    events.push(event);
  }

  events.forEach((item) => io.emit("event:new", item));
  emitReadingSideEffects(
    {
      emit(eventName, payloadToEmit) {
        if (eventName === "event:new") {
          return;
        }
        io.emit(eventName, payloadToEmit);
      }
    },
    readingRow,
    reading,
    classification,
    deviceResult,
    elder,
    event
  );

  return {
    success: true,
    received: true,
    reading: readingRow,
    device: deviceResult.current,
    elder,
    events,
    classification: {
      status: classification.status,
      eventType: classification.eventType,
      severity: classification.severity,
      riskScore: classification.riskScore,
      message: classification.message,
      accMagnitude: Number(classification.accMagnitude.toFixed(3)),
      gyroMagnitude: Number(classification.gyroMagnitude.toFixed(3))
    }
  };
}

module.exports = {
  processIncomingReading,
  listReadings
};
