
import User from "../models/User.js";
import { verifyAccessToken } from "../utils/token.js";

export const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const payload = verifyAccessToken(token);

    if (typeof payload === "string" || !payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    const user = await User.findById(payload.sub)
      .select("_id name email roles departmentId isActive");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User is unavailable or inactive",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError" ||
        error.name === "CastError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    next(error);
  }
};
