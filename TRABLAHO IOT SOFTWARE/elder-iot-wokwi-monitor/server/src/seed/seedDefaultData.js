const { get, query } = require("../db");
const { nowIso } = require("../utils/time");

async function seedDefaultData() {
  const now = nowIso();
  const elder = await get("SELECT id FROM elders WHERE id = 1");

  if (!elder) {
    await query(`
      INSERT INTO elders (
        id, name, age, "responsibleName", "responsibleEmail", "emailNotificationsEnabled",
        "responsiblePhone", "emergencyContact",
        "medicalNotes", "currentStatus", "lastLatitude", "lastLongitude",
        "lastLocationSource", "createdAt", "updatedAt"
      )
      VALUES (
        1, $1, $2, $3, $4, true,
        $5, $6,
        $7, 'NORMAL', $8, $9,
        'SEED', $10, $11
      )
      ON CONFLICT (id) DO NOTHING
    `, [
      "Maria Aparecida",
      78,
      "Carlos Silva",
      "responsavel@example.com",
      "(62) 99999-9999",
      "(62) 98888-8888",
      "Hipertensao, historico de tontura e risco de queda.",
      -16.686891,
      -49.264794,
      now,
      now
    ]);

    await query("SELECT setval(pg_get_serial_sequence('elders', 'id'), GREATEST((SELECT MAX(id) FROM elders), 1), true)");
  }

  await query(`
    UPDATE elders
    SET "responsibleEmail" = COALESCE("responsibleEmail", $1),
        "emailNotificationsEnabled" = COALESCE("emailNotificationsEnabled", true),
        "updatedAt" = COALESCE("updatedAt", $2)
    WHERE id = 1
  `, [
    "responsavel@example.com",
    now
  ]);

  const device = await get('SELECT id FROM devices WHERE "deviceId" = $1', ["ESP32_WOKWI_001"]);

  if (!device) {
    await query(`
      INSERT INTO devices (
        "deviceId", "elderId", "deviceType", "firmwareVersion", status, "batteryLevel",
        "batteryVoltage", "createdAt", "updatedAt"
      )
      VALUES (
        'ESP32_WOKWI_001', 1, 'ESP32_WOKWI_SIMULATED', '1.0.0',
        'OFFLINE', 92, 4.05, $1, $2
      )
      ON CONFLICT ("deviceId") DO NOTHING
    `, [now, now]);
  }
}

module.exports = {
  seedDefaultData
};
