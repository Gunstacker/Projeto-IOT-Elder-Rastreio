const express = require("express");
const { buildHealthPayload } = require("../services/healthService");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await buildHealthPayload());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
