require("dotenv").config();

const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || "development",
  },

  mongo: {
    uri: process.env.MONGO_URI || "mongodb://localhost:27017/activity-logs",
    options: {
      maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
    },
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    clientId: process.env.KAFKA_CLIENT_ID || "activity-log-service",
    topic: process.env.KAFKA_TOPIC || "user-activity-events",
    consumerGroup: process.env.KAFKA_CONSUMER_GROUP || "activity-log-processor",
    producer: {
      allowAutoTopicCreation: true,
      acks: parseInt(process.env.KAFKA_PRODUCER_ACKS, 10) || 1,
    },
    consumer: {
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      fromBeginning: process.env.KAFKA_FROM_BEGINNING === "true" || false,
    },
  },

  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
};

module.exports = config;
