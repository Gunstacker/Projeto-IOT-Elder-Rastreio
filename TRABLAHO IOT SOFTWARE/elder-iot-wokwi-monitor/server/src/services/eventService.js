const { all, get, query } = require("../db");
const { nowIso } = require("../utils/time");
const emailNotificationService = require("./emailNotificationService");

const EVENT_TYPES_TO_STORE = new Set([
  "FALL_IMPACT_DETECTED",
  "POST_FALL_INACTIVITY",
  "INACTIVITY",
  "LOW_BATTERY",
  "DEVICE_OFFLINE",
  "DEVICE_ONLINE",
  "PHONE_GPS_UPDATED"
]);

function shouldStoreEvent(eventType) {
  return EVENT_TYPES_TO_STORE.has(eventType);
}

function recentWindowMs(eventType) {
  return 10000;
}

async function hasRecentEvent(deviceId, eventType) {
  const since = new Date(Date.now() - recentWindowMs(eventType)).toISOString();
  const sql = deviceId
    ? 'SELECT id FROM events WHERE "deviceId" = $1 AND "eventType" = $2 AND "createdAt" >= $3 ORDER BY "createdAt" DESC LIMIT 1'
    : 'SELECT id FROM events WHERE "deviceId" IS NULL AND "eventType" = $1 AND "createdAt" >= $2 ORDER BY "createdAt" DESC LIMIT 1';
  const params = deviceId
    ? [deviceId, eventType, since]
    : [eventType, since];

  return Boolean(await get(sql, params));
}

async function getEventById(id) {
  return get(`
    SELECT events.*, elders.name AS "elderName"
    FROM events
    LEFT JOIN elders ON elders.id = events."elderId"
    WHERE events.id = $1
  `, [Number(id)]);
}

async function createEvent(input) {
  const createdAt = input.createdAt || nowIso();

  const result = await query(`
    INSERT INTO events (
      "elderId", "deviceId", "eventType", status, severity, "riskScore", message,
      latitude, longitude, source, resolved, "createdAt"
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, false, $11
    )
    RETURNING id
  `, [
    input.elderId,
    input.deviceId || null,
    input.eventType,
    input.status,
    input.severity,
    input.riskScore ?? null,
    input.message || null,
    input.latitude ?? null,
    input.longitude ?? null,
    input.source || null,
    createdAt
  ]);

  const event = await getEventById(result.rows[0].id);
  emailNotificationService.enqueueEventNotification(event).catch((error) => {
    console.error("Falha ao enfileirar e-mail de alerta:", error.message);
  });

  return event;
}

async function createEventIfAllowed(input) {
  if (!shouldStoreEvent(input.eventType)) {
    return null;
  }

  if (await hasRecentEvent(input.deviceId || null, input.eventType)) {
    return null;
  }

  return createEvent(input);
}

async function listEvents(filters = {}) {
  const where = [];
  const params = [];

  if (filters.elderId) {
    params.push(Number(filters.elderId));
    where.push(`events."elderId" = $${params.length}`);
  }

  if (filters.severity) {
    params.push(String(filters.severity).toUpperCase());
    where.push(`events.severity = $${params.length}`);
  }

  if (filters.resolved !== undefined) {
    params.push(String(filters.resolved) === "true");
    where.push(`events.resolved = $${params.length}`);
  }

  if (filters.eventType) {
    params.push(String(filters.eventType).toUpperCase());
    where.push(`events."eventType" = $${params.length}`);
  }

  if (filters.status) {
    params.push(String(filters.status).toUpperCase());
    where.push(`events.status = $${params.length}`);
  }

  if (filters.from) {
    const fromDate = new Date(filters.from);
    if (!Number.isNaN(fromDate.getTime())) {
      params.push(fromDate.toISOString());
      where.push(`events."createdAt" >= $${params.length}`);
    }
  }

  if (filters.to) {
    const toDate = new Date(filters.to);
    if (!Number.isNaN(toDate.getTime())) {
      params.push(toDate.toISOString());
      where.push(`events."createdAt" <= $${params.length}`);
    }
  }

  const limit = Math.max(1, Math.min(500, Number(filters.limit || 100)));
  params.push(limit);
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return all(`
    SELECT events.*, elders.name AS "elderName"
    FROM events
    LEFT JOIN elders ON elders.id = events."elderId"
    ${whereSql}
    ORDER BY events."createdAt" DESC
    LIMIT $${params.length}
  `, params);
}

async function resolveEvent(id, resolvedBy, notes) {
  const resolvedAt = nowIso();
  await query(`
    UPDATE events
    SET resolved = true,
        "resolvedBy" = $1,
        "resolvedNotes" = $2,
        "resolvedAt" = $3
    WHERE id = $4
  `, [
    resolvedBy || "Responsavel",
    notes || null,
    resolvedAt,
    Number(id)
  ]);

  return getEventById(Number(id));
}

module.exports = {
  shouldStoreEvent,
  createEvent,
  createEventIfAllowed,
  listEvents,
  resolveEvent
};
