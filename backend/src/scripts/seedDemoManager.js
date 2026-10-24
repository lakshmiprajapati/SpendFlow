
import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { hashPassword } from "../utils/password.js";

const seedDemoManager = async () => {
  const email = process.env.DEMO_MANAGER_EMAIL;
  const password = process.env.DEMO_MANAGER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set DEMO_MANAGER_EMAIL and DEMO_MANAGER_PASSWORD in backend/.env"
    );
  }

  if (password.length < 12) {
    throw new Error("Demo manager password must be at least 12 characters long");
  }

  await connectDB();

  const department = await Department.findOne({ code: "ENG" });

  if (!department || !department.isActive) {
    throw new Error("Active Engineering department was not found");
  }

  const normalizedEmail = email.trim().toLowerCase();

  let manager = await User.findOne({ email: normalizedEmail });

  if (manager) {
    if (!manager.isActive || !manager.roles.includes("manager")) {
      throw new Error(
        "The configured manager email already belongs to an inactive user or a user without the manager role. No changes were made."
      );
    }
  } else {
    const passwordHash = await hashPassword(password);

    manager = await User.create({
      name: "SpendFlow Demo Manager",
      email: normalizedEmail,
      passwordHash,
      roles: ["manager"],
      departmentId: department._id,
      isActive: true,
    });
  }

  // Assign the manager to the Engineering department.
  department.managerId = manager._id;
  await department.save();

  console.log("Demo manager setup completed successfully.");
  console.log(`Manager email: ${normalizedEmail}`);
  console.log("Engineering department manager assigned.");
};

seedDemoManager()
  .catch((error) => {
    console.error("Demo manager seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
