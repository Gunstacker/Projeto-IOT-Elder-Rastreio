const express = require("express");
const eventService = require("../services/eventService");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await eventService.listEvents(req.query)
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/resolve", async (req, res, next) => {
  try {
    const event = await eventService.resolveEvent(
      req.params.id,
      req.body?.resolvedBy,
      req.body?.notes
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Evento nao encontrado"
      });
    }

    return res.json({
      success: true,
      data: event
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
