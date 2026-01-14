const ActivityModel = require("./activityModel");
const { UserActivity } = require("../../domain/UserActivity");

async function saveActivity(activity) {
  const document = activity.toDocument();

  const result = await ActivityModel.upsertActivity(document);
  const wasInserted = result.processedAt >= document.processedAt;

  return {
    saved: wasInserted,
    activity: UserActivity.fromDocument(result),
  };
}

async function existsByEventId(eventId) {
  const count = await ActivityModel.countDocuments({ eventId }).limit(1);
  return count > 0;
}

async function findActivities({
  userId,
  activityType,
  from,
  to,
  page = 1,
  limit = 20,
}) {
  const filter = {};

  if (userId) {
    filter.userId = userId;
  }

  if (activityType) {
    filter.activityType = activityType;
  }

  if (from || to) {
    filter.occurredAt = {};
    if (from) {
      filter.occurredAt.$gte = new Date(from);
    }
    if (to) {
      filter.occurredAt.$lte = new Date(to);
    }
  }

  const { activities: documents, total } = await ActivityModel.findPaginated(
    filter,
    {
      page,
      limit,
    }
  );

  const activities = documents.map((doc) => UserActivity.fromDocument(doc));

  const totalPages = Math.ceil(total / limit);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

async function findByEventId(eventId) {
  const document = await ActivityModel.findOne({ eventId }).lean();

  if (!document) {
    return null;
  }

  return UserActivity.fromDocument(document);
}

async function countActivities(filter = {}) {
  return ActivityModel.countDocuments(filter);
}

async function getStatistics(userId = null) {
  const matchStage = userId ? { $match: { userId } } : { $match: {} };

  const stats = await ActivityModel.aggregate([
    matchStage,
    {
      $group: {
        _id: "$activityType",
        count: { $sum: 1 },
        lastOccurred: { $max: "$occurredAt" },
      },
    },
    {
      $project: {
        activityType: "$_id",
        count: 1,
        lastOccurred: 1,
        _id: 0,
      },
    },
  ]);

  return stats;
}

module.exports = {
  saveActivity,
  existsByEventId,
  findActivities,
  findByEventId,
  countActivities,
  getStatistics,
};
