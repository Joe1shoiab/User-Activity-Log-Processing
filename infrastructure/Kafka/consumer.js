const { Kafka } = require("kafkajs");
const config = require("../../config");

let consumer = null;
let isRunning = false;

const kafka = new Kafka({
  clientId: `${config.kafka.clientId}-consumer`,
  brokers: config.kafka.brokers,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

function createConsumer() {
  return kafka.consumer({
    groupId: config.kafka.consumerGroup,
    sessionTimeout: config.kafka.consumer.sessionTimeout,
    heartbeatInterval: config.kafka.consumer.heartbeatInterval,
    allowAutoTopicCreation: false,
  });
}

async function startConsumer(messageHandler) {
  if (isRunning) {
    console.log("[Kafka Consumer] Already running");
    return;
  }

  consumer = createConsumer();

  await consumer.connect();
  console.log("[Kafka Consumer] Connected to Kafka brokers");

  await consumer.subscribe({
    topic: config.kafka.topic,
    fromBeginning: config.kafka.consumer.fromBeginning,
  });
  console.log(`[Kafka Consumer] Subscribed to topic: ${config.kafka.topic}`);

  isRunning = true;

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const startTime = Date.now();

      try {
        const value = message.value.toString();
        const parsedMessage = JSON.parse(value);

        console.log(
          `[Kafka Consumer] Processing message: ${parsedMessage.eventId} from partition ${partition}`
        );

        await messageHandler(parsedMessage);

        const duration = Date.now() - startTime;
        console.log(
          `[Kafka Consumer] Message processed in ${duration}ms: ${parsedMessage.eventId}`
        );
      } catch (error) {
        console.error("[Kafka Consumer] Error processing message:", {
          error: error.message,
          partition,
          offset: message.offset,
          key: message.key?.toString(),
        });
      }
    },
  });
}

async function stopConsumer() {
  if (consumer && isRunning) {
    console.log("[Kafka Consumer] Stopping consumer...");

    await consumer.disconnect();
    isRunning = false;

    console.log("[Kafka Consumer] Consumer stopped");
  }
}

function isHealthy() {
  return isRunning;
}

function getConsumer() {
  return consumer;
}

module.exports = {
  startConsumer,
  stopConsumer,
  isHealthy,
  getConsumer,
};
