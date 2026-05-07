const express = require("express");
const { getLocalIpHints } = require("../utils/network");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    serverTime: new Date().toISOString(),
    localIpHints: getLocalIpHints(),
    message: "Elder IoT Monitor API running"
  });
});

module.exports = router;
