const express = require("express");
const { getIO } = require("../socket");
const readingService = require("../services/readingService");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const result = await readingService.processIncomingReading(req.body, getIO());
    res.status(201).json({
      success: true,
      received: true,
      classification: result.classification
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await readingService.listReadings(req.query)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
