const express = require("express");
const emailNotificationService = require("../services/emailNotificationService");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json({
      success: true,
      queue: emailNotificationService.getQueueState(),
      data: await emailNotificationService.listNotifications(req.query)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/retry", async (req, res, next) => {
  try {
    const notification = await emailNotificationService.retryNotification(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notificacao nao encontrada"
      });
    }

    return res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
