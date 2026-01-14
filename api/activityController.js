const {
  UserActivity,
  VALID_ACTIVITY_TYPES,
} = require("../domain/UserActivity");
const { produceActivityEvent } = require("../infrastructure/kafka/producer");
const GetActivitiesUseCase = require("../application/GetActivitiesUseCase");

async function logActivity(req, res) {
  try {
    const { userId, activityType, metadata } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    if (!activityType || !VALID_ACTIVITY_TYPES.includes(activityType)) {
      return res.status(400).json({
        success: false,
        error: `activityType must be one of: ${VALID_ACTIVITY_TYPES.join(
          ", "
        )}`,
      });
    }

    const activity = UserActivity.create({
      userId,
      activityType,
      metadata: metadata || {},
    });

    await produceActivityEvent(activity);

    return res.status(202).json({
      success: true,
      message: "Activity event accepted for processing",
      data: {
        eventId: activity.eventId,
        userId: activity.userId,
        activityType: activity.activityType,
        occurredAt: activity.occurredAt,
      },
    });
  } catch (error) {
    console.error("[Controller] Error logging activity:", error.message);

    return res.status(500).json({
      success: false,
      error: "Failed to process activity",
    });
  }
}

async function getActivities(req, res) {
  try {
    const { userId, activityType, from, to, page, limit } = req.query;

    const result = await GetActivitiesUseCase.execute({
      userId,
      activityType,
      from,
      to,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[Controller] Error fetching activities:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to fetch activities",
    });
  }
}

async function getActivityById(req, res) {
  try {
    const { eventId } = req.params;

    const activity = await GetActivitiesUseCase.getByEventId(eventId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: "Activity not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("[Controller] Error fetching activity:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to fetch activity",
    });
  }
}

async function getStatistics(req, res) {
  try {
    const { userId } = req.query;

    const stats = await GetActivitiesUseCase.getStatistics(userId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("[Controller] Error fetching statistics:", error.message);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
}

module.exports = {
  logActivity,
  getActivities,
  getActivityById,
  getStatistics,
};
