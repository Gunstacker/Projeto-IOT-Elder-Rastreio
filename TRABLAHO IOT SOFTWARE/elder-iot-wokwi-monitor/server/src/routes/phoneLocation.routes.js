const express = require("express");
const { query } = require("../db");
const { getIO } = require("../socket");
const { nowIso, toIso } = require("../utils/time");
const deviceService = require("../services/deviceService");
const eventService = require("../services/eventService");

const router = express.Router();

async function getPhoneDevice(deviceId) {
  return query(`
    SELECT devices.*, elders.name AS "elderName"
    FROM devices
    LEFT JOIN elders ON elders.id = devices."elderId"
    WHERE devices."deviceId" = $1
  `, [deviceId]).then((result) => result.rows[0] || null);
}

async function getOrCreatePhoneElder(name) {
  const existing = await query(
    "SELECT * FROM elders WHERE name = $1 ORDER BY id ASC LIMIT 1",
    [name]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const now = nowIso();
  const created = await query(`
    INSERT INTO elders (
      name, age, "responsibleName", "responsiblePhone", "emergencyContact",
      "medicalNotes", "currentStatus", "createdAt", "updatedAt"
    )
    VALUES (
      $1, null, 'Apresentacao', null, null,
      'Monitorado via celular com GPS e sensores de movimento.', 'NORMAL', $2, $3
    )
    RETURNING *
  `, [name, now, now]);

  return created.rows[0];
}

router.post("/register", async (req, res, next) => {
  try {
    const body = req.body || {};
    const deviceId = String(body.deviceId || "PHONE_ELDER_001").trim();
    const elderName = String(body.elderName || "Celular conectado").trim();
    const now = nowIso();

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: "deviceId e obrigatorio"
      });
    }

    let device = await getPhoneDevice(deviceId);
    let elder = device ? await deviceService.getElderById(device.elderId) : null;

    if (!elder) {
      elder = await getOrCreatePhoneElder(elderName);
    }

    await query(`
      INSERT INTO devices (
        "deviceId", "elderId", "deviceType", "firmwareVersion", status,
        "batteryLevel", "batteryVoltage", rssi, ip, "lastSeenAt", "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, 'SMARTPHONE_BROWSER', 'phone-web-1.0.0', 'ONLINE',
        $3, $4, $5, null, $6, $7, $8
      )
      ON CONFLICT ("deviceId") DO UPDATE
      SET "elderId" = EXCLUDED."elderId",
          "deviceType" = EXCLUDED."deviceType",
          "firmwareVersion" = EXCLUDED."firmwareVersion",
          status = 'ONLINE',
          "batteryLevel" = COALESCE(EXCLUDED."batteryLevel", devices."batteryLevel"),
          "batteryVoltage" = COALESCE(EXCLUDED."batteryVoltage", devices."batteryVoltage"),
          rssi = EXCLUDED.rssi,
          "lastSeenAt" = EXCLUDED."lastSeenAt",
          "updatedAt" = EXCLUDED."updatedAt"
    `, [
      deviceId,
      elder.id,
      typeof body.batteryLevel === "number" && Number.isFinite(body.batteryLevel)
        ? Math.round(body.batteryLevel)
        : null,
      typeof body.batteryVoltage === "number" && Number.isFinite(body.batteryVoltage)
        ? body.batteryVoltage
        : null,
      Number.isFinite(Number(body.rssi)) ? Number(body.rssi) : -45,
      now,
      now,
      now
    ]);

    await query(`
      UPDATE elders
      SET "currentStatus" = CASE WHEN "currentStatus" = 'EMERGENCY' THEN "currentStatus" ELSE 'NORMAL' END,
          "lastLatitude" = NULL,
          "lastLongitude" = NULL,
          "lastLocationSource" = 'GPS_PENDING',
          "lastSeenAt" = $1,
          "updatedAt" = $2
      WHERE id = $3
    `, [now, now, elder.id]);

    elder = await deviceService.getElderById(elder.id);
    device = await getPhoneDevice(deviceId);

    const io = getIO();
    io.emit("elder:status", elder);
    io.emit("device:status", device);

    return res.status(201).json({
      success: true,
      data: {
        elder,
        device
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = req.body || {};
    const elderId = Number(body.elderId || 1);
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        error: "Latitude e longitude sao obrigatorias"
      });
    }

    const timestamp = toIso(body.timestamp);
    const createdAt = nowIso();
    const source = body.source || "PHONE_GPS";
    const accuracy = Number.isFinite(Number(body.accuracy)) ? Number(body.accuracy) : null;

    const result = await query(`
      INSERT INTO phone_locations (
        "elderId", latitude, longitude, accuracy, source, timestamp, "createdAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING id
    `, [
      elderId,
      latitude,
      longitude,
      accuracy,
      source,
      timestamp,
      createdAt
    ]);

    const elder = await deviceService.updateElderLocation(elderId, {
      latitude,
      longitude,
      source
    });

    const event = await eventService.createEventIfAllowed({
      elderId,
      deviceId: null,
      eventType: "PHONE_GPS_UPDATED",
      status: elder?.currentStatus || "NORMAL",
      severity: "LOW",
      riskScore: 5,
      message: "Localizacao enviada pelo celular.",
      latitude,
      longitude,
      source
    });

    const io = getIO();
    io.emit("location:updated", {
      elderId,
      latitude,
      longitude,
      accuracy,
      source,
      createdAt
    });
    io.emit("elder:status", elder);
    if (event) {
      io.emit("event:new", event);
    }

    return res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        elderId,
        latitude,
        longitude,
        accuracy,
        source,
        timestamp,
        createdAt
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
