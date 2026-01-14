const { v4: uuidv4 } = require("uuid");

const ActivityType = Object.freeze({
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  PAGE_VIEW: "PAGE_VIEW",
  BUTTON_CLICK: "BUTTON_CLICK",
  ITEM_PURCHASED: "ITEM_PURCHASED",
  PROFILE_UPDATED: "PROFILE_UPDATED",
});

const VALID_ACTIVITY_TYPES = Object.values(ActivityType);

class UserActivity {
  constructor({
    eventId,
    userId,
    activityType,
    metadata,
    occurredAt,
    processedAt,
  }) {
    this.eventId = eventId;
    this.userId = userId;
    this.activityType = activityType;
    this.metadata = metadata || {};
    this.occurredAt = occurredAt;
    this.processedAt = processedAt || null;
  }

  static create({ userId, activityType, metadata = {} }) {
    if (!userId || typeof userId !== "string") {
      throw new Error("userId is required and must be a string");
    }

    if (!activityType || !VALID_ACTIVITY_TYPES.includes(activityType)) {
      throw new Error(
        `activityType must be one of: ${VALID_ACTIVITY_TYPES.join(", ")}`
      );
    }

    return new UserActivity({
      eventId: uuidv4(),
      userId,
      activityType,
      metadata,
      occurredAt: new Date().toISOString(),
      processedAt: null,
    });
  }

  static fromKafkaMessage(message) {
    const { eventId, userId, activityType, metadata, occurredAt } = message;

    if (!eventId || !userId || !activityType || !occurredAt) {
      throw new Error("Invalid Kafka message: missing required fields");
    }

    if (!VALID_ACTIVITY_TYPES.includes(activityType)) {
      throw new Error(`Invalid activityType in message: ${activityType}`);
    }

    return new UserActivity({
      eventId,
      userId,
      activityType,
      metadata: metadata || {},
      occurredAt,
      processedAt: null,
    });
  }

  static fromDocument(doc) {
    return new UserActivity({
      eventId: doc.eventId,
      userId: doc.userId,
      activityType: doc.activityType,
      metadata: doc.metadata,
      occurredAt: doc.occurredAt,
      processedAt: doc.processedAt,
    });
  }

  toKafkaMessage() {
    return {
      eventId: this.eventId,
      userId: this.userId,
      activityType: this.activityType,
      metadata: this.metadata,
      occurredAt: this.occurredAt,
    };
  }

  toDocument() {
    return {
      eventId: this.eventId,
      userId: this.userId,
      activityType: this.activityType,
      metadata: this.metadata,
      occurredAt: new Date(this.occurredAt),
      processedAt: this.processedAt ? new Date(this.processedAt) : new Date(),
    };
  }

  markAsProcessed() {
    this.processedAt = new Date().toISOString();
  }

  static isValidActivityType(type) {
    return VALID_ACTIVITY_TYPES.includes(type);
  }
}

module.exports = {
  UserActivity,
  ActivityType,
  VALID_ACTIVITY_TYPES,
};
