
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import purchaseRequestRoutes from "./routes/purchaseRequestRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";

const app = express();

// Global middleware
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SpendFlow API is running",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

// Authentication and application routes
app.use("/api/auth", authRoutes);
app.use("/api/requests", purchaseRequestRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/audit-logs", auditLogRoutes);

// Handle unknown routes — must come after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Centralized error handler — must remain last
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error("API error:", err.message);

  const statusCode = Number.isInteger(err.statusCode)
    ? err.statusCode
    : 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error"
        : err.message,
    ...(err.details ? { errors: err.details } : {}),
  });
});

export default app;
