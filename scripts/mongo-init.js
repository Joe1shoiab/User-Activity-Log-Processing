db = db.getSiblingDB("activity-logs");

db.createUser({
  user: "activity-app",
  pwd: "activity-secret",
  roles: [
    {
      role: "readWrite",
      db: "activity-logs",
    },
  ],
});

db.createCollection("activity_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "eventId",
        "userId",
        "activityType",
        "occurredAt",
        "processedAt",
      ],
      properties: {
        eventId: {
          bsonType: "string",
          description: "Unique event identifier",
        },
        userId: {
          bsonType: "string",
          description: "User identifier",
        },
        activityType: {
          bsonType: "string",
          enum: [
            "USER_LOGIN",
            "USER_LOGOUT",
            "PAGE_VIEW",
            "BUTTON_CLICK",
            "ITEM_PURCHASED",
            "PROFILE_UPDATED",
          ],
          description: "Type of activity",
        },
        metadata: {
          bsonType: "object",
          description: "Additional activity data",
        },
        occurredAt: {
          bsonType: "date",
          description: "When the activity occurred",
        },
        processedAt: {
          bsonType: "date",
          description: "When the event was processed",
        },
      },
    },
  },
});

db.activity_logs.createIndex(
  { eventId: 1 },
  { unique: true, name: "idx_eventId_unique" }
);

db.activity_logs.createIndex(
  { userId: 1, occurredAt: -1 },
  { name: "idx_userId_occurredAt" }
);

db.activity_logs.createIndex({ activityType: 1 }, { name: "idx_activityType" });

db.activity_logs.createIndex(
  { userId: 1, activityType: 1, occurredAt: -1 },
  { name: "idx_userId_activityType_occurredAt" }
);

db.activity_logs.createIndex({ occurredAt: -1 }, { name: "idx_occurredAt" });

print("MongoDB initialization complete:");
print("- Created user: activity-app");
print("- Created collection: activity_logs");
print("- Created indexes for efficient queries");
