
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import purchaseRequestRoutes from "./routes/purchaseRequestRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to SpendFlow API",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SpendFlow backend is running",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/requests", purchaseRequestRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});


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
