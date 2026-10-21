
import "dotenv/config";

import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { hashPassword } from "../utils/password.js";

const seedDemoUser = async () => {
  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set DEMO_USER_EMAIL and DEMO_USER_PASSWORD in backend/.env"
    );
  }

  if (password.length < 12) {
    throw new Error("Demo password must be at least 12 characters long");
  }

  await connectDB();

  const normalizedEmail = email.trim().toLowerCase();

  let department = await Department.findOne({ code: "ENG" });

  if (!department) {
    department = await Department.create({
      name: "Engineering",
      code: "ENG",
    });
  }

  const existingUser = await User.findOne({
    email: normalizedEmail,
  }).select("+passwordHash");

  if (existingUser) {
    console.log(
      "A user with this email already exists. No changes were made."
    );
    return;
  }

  const passwordHash = await hashPassword(password);

  await User.create({
    name: "SpendFlow Demo Employee",
    email: normalizedEmail,
    passwordHash,
    roles: ["employee"],
    departmentId: department._id,
    isActive: true,
  });

  console.log("Demo employee created successfully.");
  console.log(`Email: ${normalizedEmail}`);
  console.log("Password: configured securely through environment variables");
};

seedDemoUser()
  .catch((error) => {
    console.error("Demo user seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
