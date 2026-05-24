const { get } = require("../db");
const emailNotificationService = require("./emailNotificationService");
const { getLocalIpHints } = require("../utils/network");

async function getDatabaseStatus() {
  try {
    await get("SELECT 1 AS ok");
    return "ok";
  } catch (error) {
    return "error";
  }
}

async function buildHealthPayload() {
  const database = await getDatabaseStatus();

  return {
    status: database === "ok" ? "ok" : "degraded",
    database,
    email: emailNotificationService.getQueueState(),
    serverTime: new Date().toISOString(),
    localIpHints: getLocalIpHints(),
    message: "Elder IoT Monitor API running"
  };
}

module.exports = {
  buildHealthPayload,
  getDatabaseStatus
};
