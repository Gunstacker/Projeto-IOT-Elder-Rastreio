const { buildHealthPayload } = require("./services/healthService");

let ioInstance = null;

async function emitHeartbeat(target) {
  target.emit("server:heartbeat", await buildHealthPayload());
}

function setupSocket(io) {
  ioInstance = io;

  io.on("connection", (socket) => {
    emitHeartbeat(socket).catch((error) => {
      console.error("Falha ao emitir heartbeat:", error.message);
    });
  });

  setInterval(() => {
    emitHeartbeat(io).catch((error) => {
      console.error("Falha ao emitir heartbeat:", error.message);
    });
  }, 5000);
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.IO ainda nao foi inicializado");
  }

  return ioInstance;
}

module.exports = {
  setupSocket,
  getIO
};
