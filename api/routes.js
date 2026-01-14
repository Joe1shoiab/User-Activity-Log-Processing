const express = require("express");
const { body, query, param, validationResult } = require("express-validator");
const { VALID_ACTIVITY_TYPES } = require("../domain/UserActivity");
const activityController = require("./activityController");

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

router.post(
  "/",
  [
    body("userId")
      .notEmpty()
      .withMessage("userId is required")
      .isString()
      .withMessage("userId must be a string")
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("userId must be between 1 and 255 characters"),

    body("activityType")
      .notEmpty()
      .withMessage("activityType is required")
      .isString()
      .withMessage("activityType must be a string")
      .toUpperCase()
      .isIn(VALID_ACTIVITY_TYPES)
      .withMessage(
        `activityType must be one of: ${VALID_ACTIVITY_TYPES.join(", ")}`
      ),

    body("metadata")
      .optional()
      .isObject()
      .withMessage("metadata must be an object"),

    handleValidationErrors,
  ],
  activityController.logActivity
);

router.get(
  "/",
  [
    query("userId")
      .optional()
      .isString()
      .withMessage("userId must be a string")
      .trim()
      .isLength({ max: 255 })
      .withMessage("userId must be at most 255 characters"),

    query("activityType")
      .optional()
      .isString()
      .withMessage("activityType must be a string")
      .toUpperCase()
      .isIn(VALID_ACTIVITY_TYPES)
      .withMessage(
        `activityType must be one of: ${VALID_ACTIVITY_TYPES.join(", ")}`
      ),

    query("from")
      .optional()
      .isISO8601()
      .withMessage("from must be a valid ISO 8601 date"),

    query("to")
      .optional()
      .isISO8601()
      .withMessage("to must be a valid ISO 8601 date"),

    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit must be between 1 and 100"),

    handleValidationErrors,
  ],
  activityController.getActivities
);

router.get(
  "/stats",
  [
    query("userId")
      .optional()
      .isString()
      .withMessage("userId must be a string")
      .trim(),

    handleValidationErrors,
  ],
  activityController.getStatistics
);

router.get(
  "/:eventId",
  [
    param("eventId")
      .notEmpty()
      .withMessage("eventId is required")
      .isUUID()
      .withMessage("eventId must be a valid UUID"),

    handleValidationErrors,
  ],
  activityController.getActivityById
);

module.exports = router;
