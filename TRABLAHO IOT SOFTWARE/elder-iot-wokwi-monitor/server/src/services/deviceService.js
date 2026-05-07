const { all, get, query } = require("../db");
const { nowIso } = require("../utils/time");

async function getDeviceByDeviceId(deviceId) {
  return get('SELECT * FROM devices WHERE "deviceId" = $1', [deviceId]);
}

async function listDevices() {
  return all(`
    SELECT devices.*, elders.name AS "elderName"
    FROM devices
    LEFT JOIN elders ON elders.id = devices."elderId"
    ORDER BY devices."updatedAt" DESC
  `);
}

async function getOnlineDevices() {
  return all("SELECT * FROM devices WHERE status = 'ONLINE'");
}

async function ensureDeviceForReading(reading) {
  const existing = await getDeviceByDeviceId(reading.deviceId);
  if (existing) {
    return existing;
  }

  const now = nowIso();
  await query(`
    INSERT INTO devices (
      "deviceId", "elderId", "deviceType", "firmwareVersion", status,
      "batteryLevel", "batteryVoltage", rssi, ip, "createdAt", "updatedAt"
    )
    VALUES (
      $1, $2, $3, $4, 'OFFLINE',
      $5, $6, $7, $8, $9, $10
    )
    ON CONFLICT ("deviceId") DO NOTHING
  `, [
    reading.deviceId,
    reading.elderId,
    reading.deviceType,
    reading.firmwareVersion,
    reading.battery.level,
    reading.battery.voltage,
    reading.network.rssi,
    reading.network.ip,
    now,
    now
  ]);

  return getDeviceByDeviceId(reading.deviceId);
}

async function updateDeviceAfterReading(reading, classification) {
  const previous = await ensureDeviceForReading(reading);
  const now = nowIso();
  const lastFallAt =
    classification.eventType === "FALL_IMPACT_DETECTED"
      ? now
      : previous.lastFallAt;

  await query(`
    UPDATE devices
    SET "elderId" = $1,
        "deviceType" = $2,
        "firmwareVersion" = $3,
        status = 'ONLINE',
        "batteryLevel" = COALESCE($4, "batteryLevel"),
        "batteryVoltage" = COALESCE($5, "batteryVoltage"),
        rssi = $6,
        ip = $7,
        "lastSeenAt" = $8,
        "lastFallAt" = $9,
        "updatedAt" = $10
    WHERE "deviceId" = $11
  `, [
    reading.elderId,
    reading.deviceType,
    reading.firmwareVersion,
    reading.battery.level,
    reading.battery.voltage,
    reading.network.rssi,
    reading.network.ip,
    now,
    lastFallAt,
    now,
    reading.deviceId
  ]);

  return {
    previous,
    current: await getDeviceByDeviceId(reading.deviceId),
    cameOnline: previous.status !== "ONLINE"
  };
}

async function markDeviceOffline(deviceId) {
  const previous = await getDeviceByDeviceId(deviceId);
  if (!previous || previous.status === "OFFLINE") {
    return null;
  }

  const now = nowIso();
  await query(`
    UPDATE devices
    SET status = 'OFFLINE',
        "updatedAt" = $1
    WHERE "deviceId" = $2
  `, [now, deviceId]);

  await query(`
    UPDATE elders
    SET "currentStatus" = 'OFFLINE',
        "updatedAt" = $1
    WHERE id = $2
  `, [now, previous.elderId]);

  return getDeviceByDeviceId(deviceId);
}

async function updateElderFromReading(reading, classification) {
  const now = nowIso();
  const gps = reading.sensors.gps || {};

  await query(`
    UPDATE elders
    SET "currentStatus" = $1,
        "lastLatitude" = COALESCE($2, "lastLatitude"),
        "lastLongitude" = COALESCE($3, "lastLongitude"),
        "lastLocationSource" = COALESCE($4, "lastLocationSource"),
        "lastSeenAt" = $5,
        "updatedAt" = $6
    WHERE id = $7
  `, [
    classification.status,
    gps.latitude,
    gps.longitude,
    gps.source,
    now,
    now,
    reading.elderId
  ]);

  return getElderById(reading.elderId);
}

async function updateElderLocation(elderId, location) {
  const now = nowIso();
  await query(`
    UPDATE elders
    SET "lastLatitude" = $1,
        "lastLongitude" = $2,
        "lastLocationSource" = $3,
        "lastSeenAt" = $4,
        "updatedAt" = $5
    WHERE id = $6
  `, [
    location.latitude,
    location.longitude,
    location.source,
    now,
    now,
    elderId
  ]);

  return getElderById(elderId);
}

async function getElderById(id) {
  return get("SELECT * FROM elders WHERE id = $1", [Number(id)]);
}

module.exports = {
  getDeviceByDeviceId,
  listDevices,
  getOnlineDevices,
  ensureDeviceForReading,
  updateDeviceAfterReading,
  markDeviceOffline,
  updateElderFromReading,
  updateElderLocation,
  getElderById
};
