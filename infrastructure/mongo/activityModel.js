const mongoose = require("mongoose");
const { VALID_ACTIVITY_TYPES } = require("../../domain/UserActivity");

const activitySchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: String,
      required: true,
      index: true,
    },

    activityType: {
      type: String,
      required: true,
      enum: VALID_ACTIVITY_TYPES,
      index: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    occurredAt: {
      type: Date,
      required: true,
      index: true,
    },

    processedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: "activity_logs",

    versionKey: false,

    timestamps: false,
  }
);

activitySchema.index({ userId: 1, occurredAt: -1 });

activitySchema.index({ activityType: 1, occurredAt: -1 });

activitySchema.index({ userId: 1, activityType: 1, occurredAt: -1 });

activitySchema.statics.upsertActivity = async function (activityData) {
  return this.findOneAndUpdate(
    { eventId: activityData.eventId },
    { $setOnInsert: activityData },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

activitySchema.statics.findPaginated = async function (filter, options) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    this.find(filter).sort({ occurredAt: -1 }).skip(skip).limit(limit).lean(),
    this.countDocuments(filter),
  ]);

  return { activities, total };
};

const ActivityModel = mongoose.model("Activity", activitySchema);

module.exports = ActivityModel;
