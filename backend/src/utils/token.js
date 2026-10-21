
import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      roles: user.roles,
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
      issuer: "spendflow-api",
      audience: "spendflow-client",
    }
  );
};

export const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.verify(token, secret, {
    issuer: "spendflow-api",
    audience: "spendflow-client",
  });
};
