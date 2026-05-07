const express = require("express");
const { all, get, query } = require("../db");
const { nowIso } = require("../utils/time");

const router = express.Router();

function getElder(id) {
  return get("SELECT * FROM elders WHERE id = $1", [Number(id)]);
}

router.get("/", async (req, res, next) => {
  try {
    const elders = await all("SELECT * FROM elders ORDER BY id ASC");
    res.json({
      success: true,
      data: elders
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const now = nowIso();
    const body = req.body || {};

    if (!body.name || !String(body.name).trim()) {
      return res.status(400).json({
        success: false,
        error: "Nome do idoso e obrigatorio"
      });
    }

    const result = await query(`
      INSERT INTO elders (
        name, age, "responsibleName", "responsiblePhone", "emergencyContact",
        "medicalNotes", "currentStatus", "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, 'NORMAL', $7, $8
      )
      RETURNING id
    `, [
      String(body.name).trim(),
      body.age ? Number(body.age) : null,
      body.responsibleName || null,
      body.responsiblePhone || null,
      body.emergencyContact || null,
      body.medicalNotes || null,
      now,
      now
    ]);

    return res.status(201).json({
      success: true,
      data: await getElder(result.rows[0].id)
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const body = req.body || {};
    const existing = await getElder(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Idoso nao encontrado"
      });
    }

    await query(`
      UPDATE elders
      SET name = $1,
          age = $2,
          "responsibleName" = $3,
          "responsiblePhone" = $4,
          "emergencyContact" = $5,
          "medicalNotes" = $6,
          "updatedAt" = $7
      WHERE id = $8
    `, [
      body.name || existing.name,
      body.age === "" || body.age === undefined ? existing.age : Number(body.age),
      body.responsibleName ?? existing.responsibleName,
      body.responsiblePhone ?? existing.responsiblePhone,
      body.emergencyContact ?? existing.emergencyContact,
      body.medicalNotes ?? existing.medicalNotes,
      nowIso(),
      Number(req.params.id)
    ]);

    return res.json({
      success: true,
      data: await getElder(req.params.id)
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
