
import User from "../models/User.js";
import { comparePassword } from "../utils/password.js";
import { generateAccessToken } from "../utils/token.js";

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail })
      .select("+passwordHash");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await comparePassword(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        tokenType: "Bearer",
        expiresIn: process.env.JWT_EXPIRES_IN || "15m",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          departmentId: user.departmentId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        roles: req.user.roles,
        departmentId: req.user.departmentId,
      },
    },
  });
};

