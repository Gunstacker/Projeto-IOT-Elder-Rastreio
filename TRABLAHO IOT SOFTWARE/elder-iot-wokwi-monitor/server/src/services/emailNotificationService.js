const nodemailer = require("nodemailer");
const config = require("../config");
const { all, get, query } = require("../db");
const { nowIso } = require("../utils/time");

const EMAIL_EVENT_TYPES = new Set([
  "FALL_IMPACT_DETECTED",
  "POST_FALL_INACTIVITY",
  "LOW_BATTERY",
  "DEVICE_OFFLINE",
  "DEVICE_ONLINE"
]);

const eventLabels = {
  FALL_IMPACT_DETECTED: "Possivel queda detectada",
  POST_FALL_INACTIVITY: "Baixa movimentacao apos queda",
  LOW_BATTERY: "Bateria baixa",
  DEVICE_OFFLINE: "Dispositivo offline",
  DEVICE_ONLINE: "Dispositivo online"
};

const quickGuidance = {
  FALL_IMPACT_DETECTED: "Entre em contato com o idoso imediatamente e acione ajuda se nao houver resposta.",
  POST_FALL_INACTIVITY: "Verifique o idoso agora, pois houve impacto seguido de pouca movimentacao.",
  LOW_BATTERY: "Providencie recarga ou substituicao da bateria para manter o monitoramento ativo.",
  DEVICE_OFFLINE: "Confirme energia, Wi-Fi e proximidade do dispositivo.",
  DEVICE_ONLINE: "O dispositivo voltou a transmitir dados normalmente."
};

let transporter;
const queue = [];
let processing = false;
const SMTP_NOT_CONFIGURED_MESSAGE =
  "SMTP nao configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e EMAIL_DRY_RUN=false no server/.env para envio real.";

function normalizedSmtpPass() {
  return String(config.smtp.pass || "").replace(/\s+/g, "");
}

function isSmtpConfigured() {
  const pass = normalizedSmtpPass();

  return Boolean(
    config.smtp.host &&
    config.smtp.user &&
    pass &&
    pass !== "SENHA_DE_APP_DO_GMAIL" &&
    !pass.includes("COLOQUE_")
  );
}

function buildTransporter() {
  if (transporter) {
    return transporter;
  }

  if (config.emailDryRun) {
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return transporter;
  }

  const auth = config.smtp.user
    ? {
        user: config.smtp.user,
        pass: normalizedSmtpPass()
      }
    : undefined;

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth
  });

  return transporter;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldSendEmail(eventType) {
  return config.emailNotificationsEnabled && EMAIL_EVENT_TYPES.has(eventType);
}

function locationText(event) {
  if (!Number.isFinite(Number(event.latitude)) || !Number.isFinite(Number(event.longitude))) {
    return "Localizacao nao informada";
  }

  return `${Number(event.latitude).toFixed(6)}, ${Number(event.longitude).toFixed(6)}`;
}

function composeEmail(event, elder) {
  const label = eventLabels[event.eventType] || event.eventType;
  const time = event.createdAt ? new Date(event.createdAt).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR");
  const subject = `[Elder IoT] ${label} - ${elder.name}`;
  const body = [
    `${label} para ${elder.name} as ${time}.`,
    "",
    `Nivel de severidade: ${event.severity}`,
    `Status do dispositivo: ${event.status}`,
    `Localizacao: ${locationText(event)}`,
    `Mensagem do sistema: ${event.message || "Sem mensagem adicional."}`,
    "",
    `Orientacao rapida: ${quickGuidance[event.eventType] || "Verifique o painel de monitoramento."}`,
    "",
    "Este e-mail foi gerado automaticamente pelo Elder IoT Monitor."
  ].join("\n");

  return { subject, body };
}

async function insertNotification({ elderId, eventId, recipientEmail, subject, body, status, errorMessage }) {
  const now = nowIso();
  const result = await query(`
    INSERT INTO email_notifications (
      elder_id, event_id, recipient_email, subject, body, status,
      error_message, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `, [
    elderId || null,
    eventId || null,
    recipientEmail || null,
    subject,
    body,
    status,
    errorMessage || null,
    now,
    now
  ]);

  return result.rows[0].id;
}

async function updateNotification(id, patch) {
  const fields = [];
  const params = [];

  Object.entries(patch).forEach(([field, value]) => {
    params.push(value);
    fields.push(`${field} = $${params.length}`);
  });

  params.push(nowIso());
  fields.push(`updated_at = $${params.length}`);
  params.push(Number(id));

  await query(`
    UPDATE email_notifications
    SET ${fields.join(", ")}
    WHERE id = $${params.length}
  `, params);
}

async function sendNotification(id) {
  const notification = await get("SELECT * FROM email_notifications WHERE id = $1", [Number(id)]);
  if (!notification || notification.status === "SENT" || !notification.recipient_email) {
    return;
  }

  if (config.emailDryRun) {
    await updateNotification(id, {
      status: "DRY_RUN",
      attempts: 0,
      error_message: isSmtpConfigured()
        ? "EMAIL_DRY_RUN=true; notificacao registrada, mas envio real desativado."
        : SMTP_NOT_CONFIGURED_MESSAGE
    });
    return;
  }

  if (!isSmtpConfigured()) {
    await updateNotification(id, {
      status: "FAILED",
      attempts: 0,
      error_message: SMTP_NOT_CONFIGURED_MESSAGE
    });
    return;
  }

  let lastError = null;
  const maxAttempts = Math.max(1, config.emailRetryAttempts);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await updateNotification(id, {
        status: attempt === 1 ? "SENDING" : "RETRYING",
        attempts: attempt
      });

      await buildTransporter().sendMail({
        from: config.emailFrom,
        to: notification.recipient_email,
        subject: notification.subject,
        text: notification.body
      });

      await updateNotification(id, {
        status: "SENT",
        sent_at: nowIso(),
        error_message: null
      });
      return;
    } catch (error) {
      lastError = error;
      await updateNotification(id, {
        status: "RETRYING",
        attempts: attempt,
        error_message: error.message
      });

      if (attempt < maxAttempts) {
        await wait(config.emailRetryDelayMs);
      }
    }
  }

  await updateNotification(id, {
    status: "FAILED",
    error_message: lastError?.message || "Falha desconhecida no envio"
  });
}

async function processQueue() {
  if (processing) {
    return;
  }

  processing = true;
  try {
    while (queue.length) {
      const id = queue.shift();
      await sendNotification(id);
    }
  } finally {
    processing = false;
  }
}

async function enqueueEventNotification(event) {
  if (!event || !shouldSendEmail(event.eventType)) {
    return null;
  }

  const elder = await get("SELECT * FROM elders WHERE id = $1", [Number(event.elderId)]);
  if (!elder) {
    return null;
  }

  const { subject, body } = composeEmail(event, elder);

  if (elder.emailNotificationsEnabled === false) {
    return insertNotification({
      elderId: event.elderId,
      eventId: event.id,
      recipientEmail: elder.responsibleEmail,
      subject,
      body,
      status: "SKIPPED",
      errorMessage: "Notificacoes por e-mail desativadas para este idoso."
    });
  }

  if (!elder.responsibleEmail) {
    return insertNotification({
      elderId: event.elderId,
      eventId: event.id,
      recipientEmail: null,
      subject,
      body,
      status: "SKIPPED",
      errorMessage: "E-mail do responsavel nao cadastrado."
    });
  }

  const existing = await get("SELECT id FROM email_notifications WHERE event_id = $1 LIMIT 1", [Number(event.id)]);
  if (existing) {
    return existing.id;
  }

  const id = await insertNotification({
    elderId: event.elderId,
    eventId: event.id,
    recipientEmail: elder.responsibleEmail,
    subject,
    body,
    status: "PENDING"
  });

  queue.push(id);
  processQueue().catch((error) => {
    console.error("Erro na fila de e-mail:", error.message);
  });

  return id;
}

async function retryNotification(id) {
  const notification = await get("SELECT * FROM email_notifications WHERE id = $1", [Number(id)]);
  if (!notification) {
    return null;
  }

  await updateNotification(id, {
    status: "PENDING",
    error_message: null
  });
  queue.push(Number(id));
  processQueue().catch((error) => {
    console.error("Erro na fila de e-mail:", error.message);
  });

  return getNotificationById(id);
}

async function getNotificationById(id) {
  return get(`
    SELECT
      email_notifications.id,
      email_notifications.elder_id AS "elderId",
      email_notifications.event_id AS "eventId",
      email_notifications.recipient_email AS "recipientEmail",
      email_notifications.subject,
      email_notifications.body,
      email_notifications.status,
      email_notifications.attempts,
      email_notifications.sent_at AS "sentAt",
      email_notifications.error_message AS "errorMessage",
      email_notifications.created_at AS "createdAt",
      email_notifications.updated_at AS "updatedAt",
      elders.name AS "elderName",
      events."eventType"
    FROM email_notifications
    LEFT JOIN elders ON elders.id = email_notifications.elder_id
    LEFT JOIN events ON events.id = email_notifications.event_id
    WHERE email_notifications.id = $1
  `, [Number(id)]);
}

async function listNotifications(filters = {}) {
  const where = [];
  const params = [];

  if (filters.status) {
    params.push(String(filters.status).toUpperCase());
    where.push(`email_notifications.status = $${params.length}`);
  }

  if (filters.elderId) {
    params.push(Number(filters.elderId));
    where.push(`email_notifications.elder_id = $${params.length}`);
  }

  const limit = Math.max(1, Math.min(500, Number(filters.limit || 100)));
  params.push(limit);
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return all(`
    SELECT
      email_notifications.id,
      email_notifications.elder_id AS "elderId",
      email_notifications.event_id AS "eventId",
      email_notifications.recipient_email AS "recipientEmail",
      email_notifications.subject,
      email_notifications.body,
      email_notifications.status,
      email_notifications.attempts,
      email_notifications.sent_at AS "sentAt",
      email_notifications.error_message AS "errorMessage",
      email_notifications.created_at AS "createdAt",
      email_notifications.updated_at AS "updatedAt",
      elders.name AS "elderName",
      events."eventType"
    FROM email_notifications
    LEFT JOIN elders ON elders.id = email_notifications.elder_id
    LEFT JOIN events ON events.id = email_notifications.event_id
    ${whereSql}
    ORDER BY email_notifications.created_at DESC
    LIMIT $${params.length}
  `, params);
}

function getQueueState() {
  return {
    enabled: config.emailNotificationsEnabled,
    dryRun: config.emailDryRun,
    smtpConfigured: isSmtpConfigured(),
    readyForRealDelivery: config.emailNotificationsEnabled && !config.emailDryRun && isSmtpConfigured(),
    queued: queue.length,
    processing
  };
}

module.exports = {
  EMAIL_EVENT_TYPES,
  shouldSendEmail,
  enqueueEventNotification,
  retryNotification,
  getNotificationById,
  listNotifications,
  getQueueState
};
