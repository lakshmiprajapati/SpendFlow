
import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import { hashPassword } from "../utils/password.js";

const resetDemoPassword = async () => {
  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error(
      "Set DEMO_USER_EMAIL and a password of at least 12 characters in .env"
    );
  }

  await connectDB();

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select("+passwordHash");

  if (!user) {
    throw new Error(
      "Demo user not found. Run the seed script first."
    );
  }

  user.passwordHash = await hashPassword(password);
  await user.save();

  console.log("Demo password updated successfully.");
  console.log(`Email: ${user.email}`);
};

resetDemoPassword()
  .catch((error) => {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
