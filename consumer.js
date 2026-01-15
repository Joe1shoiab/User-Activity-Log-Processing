const config = require("./config");
const {
  startConsumer,
  stopConsumer,
} = require("./infrastructure/kafka/consumer");
const {
  connect: connectMongo,
  disconnect: disconnectMongo,
  isHealthy: isMongoHealthy,
} = require("./infrastructure/mongo/connection");
const ProcessActivityUseCase = require("./application/ProcessActivityUseCase");

let isShuttingDown = false;

async function handleMessage(message) {
  return ProcessActivityUseCase.execute(message);
}

async function startWorker() {
  try {
    await connectMongo();

    if (!isMongoHealthy()) {
      throw new Error("MongoDB connection not healthy");
    }

    await startConsumer(handleMessage);

    console.log("=".repeat(60));
    console.log("[Consumer] Worker is running and processing events");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("[Consumer] Failed to start worker:", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (isShuttingDown) {
    console.log("[Consumer] Shutdown already in progress...");
    return;
  }

  isShuttingDown = true;
  console.log(`\n[Consumer] Received ${signal}, shutting down gracefully...`);

  try {
    await stopConsumer();

    await disconnectMongo();

    console.log("[Consumer] Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("[Consumer] Error during shutdown:", error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('[Consumer] Uncaught Exception:', error);
  shutdown('uncaughtException').finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Consumer] Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection').finally(() => process.exit(1));
});
startWorker();
