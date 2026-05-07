require("dotenv").config();

const port = Number(process.env.PORT || 3000);
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/elder_iot_monitor";
const pgSsl = String(process.env.PGSSL || "false").toLowerCase() === "true";

module.exports = {
  port,
  databaseUrl,
  pgSsl,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  offlineAfterSeconds: Number(process.env.OFFLINE_AFTER_SECONDS || 10),
  offlineCheckIntervalMs: Number(process.env.OFFLINE_CHECK_INTERVAL_MS || 5000)
};
