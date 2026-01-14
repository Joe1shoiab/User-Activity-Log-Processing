const mongoose = require("mongoose");
const config = require("../../config");

let isConnected = false;

async function connect() {
  if (isConnected) {
    console.log("[MongoDB] Already connected");
    return;
  }

  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(config.mongo.uri, {
      maxPoolSize: config.mongo.options.maxPoolSize,
    });

    isConnected = true;
    console.log("[MongoDB] Connected successfully");

    mongoose.connection.on("error", (error) => {
      console.error("[MongoDB] Connection error:", error.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("[MongoDB] Disconnected");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("[MongoDB] Reconnected");
      isConnected = true;
    });
  } catch (error) {
    console.error("[MongoDB] Failed to connect:", error.message);
    throw error;
  }
}

async function disconnect() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("[MongoDB] Disconnected successfully");
  } catch (error) {
    console.error("[MongoDB] Error during disconnect:", error.message);
    throw error;
  }
}

function isHealthy() {
  return isConnected && mongoose.connection.readyState === 1;
}

function getConnectionState() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    state: states[mongoose.connection.readyState] || "unknown",
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
  };
}

module.exports = {
  connect,
  disconnect,
  isHealthy,
  getConnectionState,
};
