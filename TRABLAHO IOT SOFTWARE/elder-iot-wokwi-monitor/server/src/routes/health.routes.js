const express = require("express");
const { get } = require("../db");
const emailNotificationService = require("../services/emailNotificationService");
const { getLocalIpHints } = require("../utils/network");

const router = express.Router();

router.get("/", async (req, res) => {
  let database = "ok";
  try {
    await get("SELECT 1 AS ok");
  } catch (error) {
    database = "error";
  }

  res.json({
    status: database === "ok" ? "ok" : "degraded",
    database,
    email: emailNotificationService.getQueueState(),
    serverTime: new Date().toISOString(),
    localIpHints: getLocalIpHints(),
    message: "Elder IoT Monitor API running"
  });
});

module.exports = router;
