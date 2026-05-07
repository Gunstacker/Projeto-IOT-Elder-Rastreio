const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const config = require("./config");
const { initDatabase } = require("./db");
const { seedDefaultData } = require("./seed/seedDefaultData");
const { setupSocket } = require("./socket");
const { startOfflineMonitor } = require("./services/offlineMonitor");

const healthRoutes = require("./routes/health.routes");
const readingsRoutes = require("./routes/readings.routes");
const eldersRoutes = require("./routes/elders.routes");
const devicesRoutes = require("./routes/devices.routes");
const eventsRoutes = require("./routes/events.routes");
const phoneLocationRoutes = require("./routes/phoneLocation.routes");
const simulationRoutes = require("./routes/simulation.routes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.corsOrigin === "*" ? "*" : config.corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

setupSocket(io);

app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/health", healthRoutes);
app.use("/api/iot/readings", readingsRoutes);
app.use("/api/elders", eldersRoutes);
app.use("/api/devices", devicesRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/location/phone", phoneLocationRoutes);
app.use("/api/simulation", simulationRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "Elder IoT Monitor API",
    status: "ok",
    docs: "/api/health"
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Rota nao encontrada"
  });
});

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  res.status(status).json({
    success: false,
    error: error.message || "Erro interno do servidor"
  });
});

async function start() {
  await initDatabase();
  await seedDefaultData();

  server.listen(config.port, "0.0.0.0", () => {
    console.log(`API running on http://localhost:${config.port}`);
    console.log(`PostgreSQL database: ${config.databaseUrl}`);
  });

  startOfflineMonitor(io);
}

start().catch((error) => {
  console.error("Falha ao iniciar API:", error);
  process.exit(1);
});
