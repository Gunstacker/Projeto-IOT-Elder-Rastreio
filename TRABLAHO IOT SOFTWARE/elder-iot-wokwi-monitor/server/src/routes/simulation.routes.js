const express = require("express");
const { getIO } = require("../socket");
const readingService = require("../services/readingService");

const router = express.Router();

const route = [
  [-16.686891, -49.264794],
  [-16.68684, -49.26473],
  [-16.68679, -49.26469],
  [-16.68674, -49.26465]
];

function randomAround(base, variation) {
  return base + (Math.random() * 2 - 1) * variation;
}

function valuesForMode(mode) {
  const upper = String(mode || "STANDING").toUpperCase();

  if (upper === "FALL_IMPACT") {
    return {
      acc: { x: randomAround(2.8, 0.35), y: randomAround(1.6, 0.25), z: randomAround(3.4, 0.4) },
      gyro: { x: randomAround(180, 20), y: randomAround(95, 18), z: randomAround(40, 10) },
      scenario: "FALL_IMPACT",
      battery: 84
    };
  }

  if (upper === "POST_FALL") {
    return {
      acc: { x: randomAround(0.88, 0.03), y: randomAround(0.14, 0.02), z: randomAround(0.23, 0.03) },
      gyro: { x: randomAround(0.4, 0.2), y: randomAround(0.3, 0.2), z: randomAround(0.2, 0.2) },
      scenario: "POST_FALL",
      battery: 84
    };
  }

  if (upper === "INACTIVE") {
    return {
      acc: { x: randomAround(0.01, 0.01), y: randomAround(0.01, 0.01), z: randomAround(0.99, 0.02) },
      gyro: { x: randomAround(0.05, 0.03), y: randomAround(0.04, 0.03), z: randomAround(0.03, 0.03) },
      scenario: "INACTIVITY",
      battery: 83
    };
  }

  if (upper === "LOW_BATTERY") {
    return {
      acc: { x: randomAround(0.02, 0.03), y: randomAround(0.01, 0.03), z: randomAround(1, 0.05) },
      gyro: { x: randomAround(0.3, 0.2), y: randomAround(0.2, 0.2), z: randomAround(0.1, 0.2) },
      scenario: "LOW_BATTERY",
      battery: 10
    };
  }

  if (upper === "WALKING") {
    return {
      acc: { x: randomAround(0.28, 0.15), y: randomAround(0.14, 0.1), z: randomAround(1.12, 0.2) },
      gyro: { x: randomAround(4.5, 2), y: randomAround(2.1, 1.2), z: randomAround(1.8, 1) },
      scenario: "NORMAL_MOVEMENT",
      battery: 86
    };
  }

  return {
    acc: { x: randomAround(0.02, 0.03), y: randomAround(0.01, 0.03), z: randomAround(1, 0.05) },
    gyro: { x: randomAround(0.3, 0.2), y: randomAround(0.2, 0.2), z: randomAround(0.1, 0.2) },
    scenario: "NORMAL_READING",
    battery: 88
  };
}

function buildLocalPayload(body = {}) {
  const mode = String(body.mode || "STANDING").toUpperCase();
  const selected = valuesForMode(mode);
  const point = route[Math.floor(Math.random() * route.length)];

  return {
    deviceId: body.deviceId || "ESP32_WOKWI_001",
    deviceType: "ESP32_WOKWI_SIMULATED",
    firmwareVersion: "1.0.0",
    elderId: Number(body.elderId || 1),
    timestamp: new Date().toISOString(),
    uptimeMs: Date.now(),
    network: {
      ssid: "LOCAL_FALLBACK",
      rssi: -42,
      ip: "127.0.0.1",
      transport: "LOCAL_SIMULATOR"
    },
    battery: {
      level: selected.battery,
      charging: false,
      voltage: selected.battery <= 15 ? 3.45 : 3.9
    },
    sensors: {
      mpu6050: {
        accelerometer: { ...selected.acc, unit: "g" },
        gyroscope: { ...selected.gyro, unit: "deg/s" },
        temperature: 31.2
      },
      gps: {
        latitude: randomAround(point[0], 0.00003),
        longitude: randomAround(point[1], 0.00003),
        accuracy: 8.5,
        speed: mode === "WALKING" ? 0.6 : 0,
        source: "LOCAL_SIMULATED_ROUTE"
      }
    },
    simulation: {
      source: "LOCAL_FALLBACK",
      mode,
      isSimulated: true,
      scenario: selected.scenario
    }
  };
}

router.post("/local-reading", async (req, res, next) => {
  try {
    const payload = req.body?.payload || buildLocalPayload(req.body);
    const result = await readingService.processIncomingReading(payload, getIO());
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
