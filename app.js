const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");

const config = require("./config");
const activityRoutes = require("./api/routes");
const {
  getProducer,
  disconnect: disconnectProducer,
  isHealthy: isProducerHealthy,
} = require("./infrastructure/kafka/producer");
const {
  connect: connectMongo,
  disconnect: disconnectMongo,
  isHealthy: isMongoHealthy,
  getConnectionState,
} = require("./infrastructure/mongo/connection");

const app = express();

app.use(helmet());

app.use(cors());

app.use(express.json({ limit: "1mb" }));

app.use(express.urlencoded({ extended: true }));

app.use(compression());

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

app.get("/health", async (req, res) => {
  const kafkaHealthy = isProducerHealthy();
  const mongoHealthy = isMongoHealthy();
  const mongoState = getConnectionState();

  const isHealthy = kafkaHealthy && mongoHealthy;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    services: {
      kafka: {
        status: kafkaHealthy ? "connected" : "disconnected",
      },
      mongodb: {
        status: mongoHealthy ? "connected" : "disconnected",
        ...mongoState,
      },
    },
  });
});

app.get("/ready", (req, res) => {
  const kafkaHealthy = isProducerHealthy();
  const mongoHealthy = isMongoHealthy();

  if (kafkaHealthy && mongoHealthy) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false });
  }
});

app.get("/live", (req, res) => {
  res.status(200).json({ alive: true });
});

app.use("/activities", activityRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

app.use((err, req, res, next) => {
  console.error("[Error]", err);

  res.status(err.statusCode || 500).json({
    success: false,
    error:
      config.server.env === "production"
        ? "Internal server error"
        : err.message,
  });
});

async function startServer() {
  try {
    console.log("[Startup] Connecting to MongoDB...");
    await connectMongo();

    console.log("[Startup] Connecting to Kafka...");
    await getProducer();

    const server = app.listen(config.server.port, () => {
      console.log("=".repeat(60));
      console.log(`[Server] API Service running on port ${config.server.port}`);
      console.log(`[Server] Environment: ${config.server.env}`);
    });

    setupGracefulShutdown(server);
  } catch (error) {
    console.error("[Startup] Failed to start server:", error);
    process.exit(1);
  }
}

function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    console.log(`\n[Shutdown] Received ${signal}, shutting down gracefully...`);

    server.close(async () => {
      console.log("[Shutdown] HTTP server closed");

      try {
        await disconnectProducer();

        await disconnectMongo();

        console.log("[Shutdown] All connections closed");
        process.exit(0);
      } catch (error) {
        console.error("[Shutdown] Error during cleanup:", error);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error("[Shutdown] Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };
}

startServer();

module.exports = app;
