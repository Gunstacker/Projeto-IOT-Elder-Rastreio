const express = require("express");
const deviceService = require("../services/deviceService");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await deviceService.listDevices()
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:deviceId/status", async (req, res, next) => {
  try {
    const device = await deviceService.getDeviceByDeviceId(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: "Dispositivo nao encontrado"
      });
    }

    return res.json({
      success: true,
      data: device
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
