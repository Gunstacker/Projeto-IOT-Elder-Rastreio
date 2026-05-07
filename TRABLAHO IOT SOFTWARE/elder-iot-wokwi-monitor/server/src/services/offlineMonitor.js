const config = require("../config");
const { ageInMs, nowIso } = require("../utils/time");
const deviceService = require("./deviceService");
const eventService = require("./eventService");

function startOfflineMonitor(io) {
  setInterval(async () => {
    try {
      const devices = await deviceService.getOnlineDevices();

      for (const device of devices) {
        const age = ageInMs(device.lastSeenAt);
        if (age <= config.offlineAfterSeconds * 1000) {
          continue;
        }

        const offlineDevice = await deviceService.markDeviceOffline(device.deviceId);
        if (!offlineDevice) {
          continue;
        }

        const event = await eventService.createEventIfAllowed({
          elderId: offlineDevice.elderId,
          deviceId: offlineDevice.deviceId,
          eventType: "DEVICE_OFFLINE",
          status: "OFFLINE",
          severity: "MEDIUM",
          riskScore: 60,
          message: "Dispositivo sem comunicacao por mais de 10 segundos.",
          source: "OFFLINE_MONITOR",
          createdAt: nowIso()
        });

        const elder = await deviceService.getElderById(offlineDevice.elderId);
        io.emit("device:status", offlineDevice);
        io.emit("elder:status", elder);

        if (event) {
          io.emit("event:new", event);
        }
      }
    } catch (error) {
      console.error("Erro no monitor offline:", error.message);
    }
  }, config.offlineCheckIntervalMs);
}

module.exports = {
  startOfflineMonitor
};
