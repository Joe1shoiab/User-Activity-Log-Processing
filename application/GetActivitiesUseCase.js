const activityRepository = require("../infrastructure/mongo/activityRepository");
const { VALID_ACTIVITY_TYPES } = require("../domain/UserActivity");
const config = require("../config");

async function execute(params) {
  const sanitized = sanitizeParams(params);

  if (
    sanitized.activityType &&
    !VALID_ACTIVITY_TYPES.includes(sanitized.activityType)
  ) {
    throw new ValidationError(
      `Invalid activityType. Must be one of: ${VALID_ACTIVITY_TYPES.join(", ")}`
    );
  }

  if (sanitized.from && sanitized.to) {
    const fromDate = new Date(sanitized.from);
    const toDate = new Date(sanitized.to);

    if (fromDate > toDate) {
      throw new ValidationError("from date must be before or equal to to date");
    }
  }

  const { activities, pagination } = await activityRepository.findActivities(
    sanitized
  );

  const data = activities.map((activity) => ({
    eventId: activity.eventId,
    userId: activity.userId,
    activityType: activity.activityType,
    metadata: activity.metadata,
    occurredAt: activity.occurredAt,
    processedAt: activity.processedAt,
  }));

  return {
    data,
    pagination,
  };
}

function sanitizeParams(params) {
  const { userId, activityType, from, to, page, limit } = params;

  let parsedPage = parseInt(page, 10);
  if (isNaN(parsedPage) || parsedPage < 1) {
    parsedPage = config.pagination.defaultPage;
  }

  let parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 1) {
    parsedLimit = config.pagination.defaultLimit;
  }
  parsedLimit = Math.min(parsedLimit, config.pagination.maxLimit);

  return {
    userId: userId?.trim() || undefined,
    activityType: activityType?.trim().toUpperCase() || undefined,
    from: isValidDate(from) ? from : undefined,
    to: isValidDate(to) ? to : undefined,
    page: parsedPage,
    limit: parsedLimit,
  };
}

function isValidDate(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

async function getByEventId(eventId) {
  if (!eventId) {
    throw new ValidationError("eventId is required");
  }

  const activity = await activityRepository.findByEventId(eventId);

  if (!activity) {
    return null;
  }

  return {
    eventId: activity.eventId,
    userId: activity.userId,
    activityType: activity.activityType,
    metadata: activity.metadata,
    occurredAt: activity.occurredAt,
    processedAt: activity.processedAt,
  };
}

async function getStatistics(userId) {
  return activityRepository.getStatistics(userId);
}

module.exports = {
  execute,
  getByEventId,
  getStatistics,
  ValidationError,
};
