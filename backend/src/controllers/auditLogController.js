
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";

export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = "1",
      limit = "20",
      action,
      entityType,
    } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const filter = {};

    if (action) {
      if (!AuditLog.schema.path("action").enumValues.includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Invalid audit action",
        });
      }

      filter.action = action;
    }

    if (entityType) {
      if (
        !AuditLog.schema.path("entityType").enumValues.includes(entityType)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid entity type",
        });
      }

      filter.entityType = entityType;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actorId", "name email")
        .sort({ createdAt: -1, _id: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),

      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};
