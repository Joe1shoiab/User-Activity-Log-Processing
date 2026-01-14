const { Kafka, Partitioners } = require("kafkajs");
const config = require("../../config");

let producer = null;
let isConnected = false;

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

async function getProducer() {
  if (producer && isConnected) {
    return producer;
  }

  producer = kafka.producer({
    allowAutoTopicCreation: config.kafka.producer.allowAutoTopicCreation,
    createPartitioner: Partitioners.DefaultPartitioner,
  });

  await producer.connect();
  isConnected = true;

  console.log("[Kafka Producer] Connected to Kafka brokers");

  return producer;
}

async function produceActivityEvent(activity) {
  const prod = await getProducer();

  const message = activity.toKafkaMessage();

  await prod.send({
    topic: config.kafka.topic,
    acks: config.kafka.producer.acks,
    messages: [
      {
        key: message.userId,
        value: JSON.stringify(message),
        headers: {
          "event-type": message.activityType,
          "produced-at": new Date().toISOString(),
        },
      },
    ],
  });

  console.log(
    `[Kafka Producer] Event produced: ${message.eventId} for user: ${message.userId}`
  );
}

async function disconnect() {
  if (producer && isConnected) {
    await producer.disconnect();
    isConnected = false;
    console.log("[Kafka Producer] Disconnected from Kafka");
  }
}

function isHealthy() {
  return isConnected;
}

module.exports = {
  getProducer,
  produceActivityEvent,
  disconnect,
  isHealthy,
};
