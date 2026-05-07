let ioInstance = null;

function setupSocket(io) {
  ioInstance = io;

  io.on("connection", (socket) => {
    socket.emit("server:heartbeat", {
      status: "connected",
      serverTime: new Date().toISOString()
    });
  });

  setInterval(() => {
    io.emit("server:heartbeat", {
      status: "ok",
      serverTime: new Date().toISOString()
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
