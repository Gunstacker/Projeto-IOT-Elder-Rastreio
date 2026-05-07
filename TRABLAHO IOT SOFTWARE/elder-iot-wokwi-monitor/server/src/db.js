const { Pool } = require("pg");
const config = require("./config");

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.pgSsl ? { rejectUnauthorized: false } : false
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function get(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

async function all(text, params = []) {
  const result = await query(text, params);
  return result.rows;
}

async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS elders (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER,
      "responsibleName" TEXT,
      "responsiblePhone" TEXT,
      "emergencyContact" TEXT,
      "medicalNotes" TEXT,
      "currentStatus" TEXT DEFAULT 'NORMAL',
      "lastLatitude" DOUBLE PRECISION,
      "lastLongitude" DOUBLE PRECISION,
      "lastLocationSource" TEXT,
      "lastSeenAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id SERIAL PRIMARY KEY,
      "deviceId" TEXT UNIQUE NOT NULL,
      "elderId" INTEGER NOT NULL REFERENCES elders(id),
      "deviceType" TEXT,
      "firmwareVersion" TEXT,
      status TEXT DEFAULT 'OFFLINE',
      "batteryLevel" INTEGER,
      "batteryVoltage" DOUBLE PRECISION,
      rssi INTEGER,
      ip TEXT,
      "lastSeenAt" TIMESTAMPTZ,
      "lastFallAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS readings (
      id SERIAL PRIMARY KEY,
      "deviceId" TEXT NOT NULL,
      "elderId" INTEGER NOT NULL REFERENCES elders(id),
      timestamp TIMESTAMPTZ,
      source TEXT,
      "simulationMode" TEXT,
      scenario TEXT,
      "accX" DOUBLE PRECISION,
      "accY" DOUBLE PRECISION,
      "accZ" DOUBLE PRECISION,
      "gyroX" DOUBLE PRECISION,
      "gyroY" DOUBLE PRECISION,
      "gyroZ" DOUBLE PRECISION,
      "accMagnitude" DOUBLE PRECISION,
      "gyroMagnitude" DOUBLE PRECISION,
      temperature DOUBLE PRECISION,
      "batteryLevel" INTEGER,
      "batteryVoltage" DOUBLE PRECISION,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      "gpsAccuracy" DOUBLE PRECISION,
      "gpsSource" TEXT,
      rssi INTEGER,
      "classificationStatus" TEXT,
      "eventType" TEXT,
      severity TEXT,
      "riskScore" INTEGER,
      "rawJson" JSONB,
      "createdAt" TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      "elderId" INTEGER NOT NULL REFERENCES elders(id),
      "deviceId" TEXT,
      "eventType" TEXT NOT NULL,
      status TEXT NOT NULL,
      severity TEXT NOT NULL,
      "riskScore" INTEGER,
      message TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      source TEXT,
      resolved BOOLEAN DEFAULT false,
      "resolvedBy" TEXT,
      "resolvedNotes" TEXT,
      "resolvedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS phone_locations (
      id SERIAL PRIMARY KEY,
      "elderId" INTEGER NOT NULL REFERENCES elders(id),
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      accuracy DOUBLE PRECISION,
      source TEXT,
      timestamp TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_readings_elder_created ON readings("elderId", "createdAt");
    CREATE INDEX IF NOT EXISTS idx_readings_device_created ON readings("deviceId", "createdAt");
    CREATE INDEX IF NOT EXISTS idx_events_elder_created ON events("elderId", "createdAt");
    CREATE INDEX IF NOT EXISTS idx_events_device_type_created ON events("deviceId", "eventType", "createdAt");
    CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
  `);
}

module.exports = {
  pool,
  query,
  get,
  all,
  initDatabase
};
