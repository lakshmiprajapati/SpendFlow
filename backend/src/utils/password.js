
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const hashPassword = async (password) => {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Password cannot exceed 72 UTF-8 bytes");
  }

  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, passwordHash) => {
  if (typeof password !== "string" || typeof passwordHash !== "string") {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
};
