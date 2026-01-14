const { UserActivity } = require("../domain/UserActivity");
const activityRepository = require("../infrastructure/mongo/activityRepository");

async function execute(message) {
  const startTime = Date.now();

  try {
    const activity = UserActivity.fromKafkaMessage(message);

    activity.markAsProcessed();

    const { saved, activity: savedActivity } =
      await activityRepository.saveActivity(activity);

    const duration = Date.now() - startTime;

    if (saved) {
      console.log(
        `[ProcessActivity] New activity saved: ${activity.eventId} (${duration}ms)`
      );
    } else {
      console.log(
        `[ProcessActivity] Duplicate activity skipped: ${activity.eventId} (${duration}ms)`
      );
    }

    return {
      success: true,
      isNew: saved,
      eventId: activity.eventId,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`[ProcessActivity] Failed to process event:`, {
      error: error.message,
      eventId: message?.eventId,
      duration,
    });

    throw error;
  }
}

async function executeBatch(messages) {
  const results = [];
  let processed = 0;
  let failed = 0;

  for (const message of messages) {
    try {
      const result = await execute(message);
      results.push(result);
      processed++;
    } catch (error) {
      results.push({
        success: false,
        eventId: message?.eventId,
        error: error.message,
      });
      failed++;
    }
  }

  return { processed, failed, results };
}

module.exports = {
  execute,
  executeBatch,
};
