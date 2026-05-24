require("dotenv").config();

const port = Number(process.env.PORT || 3000);
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/elder_iot_monitor";
const pgSsl = String(process.env.PGSSL || "false").toLowerCase() === "true";
const hasSmtpHost = Boolean(process.env.SMTP_HOST);
const emailDryRunDefault = hasSmtpHost ? "false" : "true";

module.exports = {
  port,
  databaseUrl,
  pgSsl,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  offlineAfterSeconds: Number(process.env.OFFLINE_AFTER_SECONDS || 10),
  offlineCheckIntervalMs: Number(process.env.OFFLINE_CHECK_INTERVAL_MS || 5000),
  emailNotificationsEnabled: String(process.env.EMAIL_NOTIFICATIONS_ENABLED || "true").toLowerCase() !== "false",
  emailDryRun: String(process.env.EMAIL_DRY_RUN || emailDryRunDefault).toLowerCase() === "true",
  emailFrom: process.env.EMAIL_FROM || "Elder IoT Monitor <alerts@elder-iot.local>",
  emailRetryAttempts: Number(process.env.EMAIL_RETRY_ATTEMPTS || 3),
  emailRetryDelayMs: Number(process.env.EMAIL_RETRY_DELAY_MS || 1200),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || ""
  }
};
