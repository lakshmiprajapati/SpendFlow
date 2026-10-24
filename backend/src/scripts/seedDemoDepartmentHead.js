
import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { hashPassword } from "../utils/password.js";

const seedDemoDepartmentHead = async () => {
  const email = process.env.DEMO_DEPARTMENT_HEAD_EMAIL;
  const password = process.env.DEMO_DEPARTMENT_HEAD_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set DEMO_DEPARTMENT_HEAD_EMAIL and DEMO_DEPARTMENT_HEAD_PASSWORD in backend/.env"
    );
  }

  if (password.length < 12) {
    throw new Error(
      "Demo department head password must be at least 12 characters long"
    );
  }

  await connectDB();

  const department = await Department.findOne({ code: "ENG" });

  if (!department || !department.isActive) {
    throw new Error("Active Engineering department was not found");
  }

  const normalizedEmail = email.trim().toLowerCase();

  let departmentHead = await User.findOne({
    email: normalizedEmail,
  });

  if (departmentHead) {
    if (
      !departmentHead.isActive ||
      !departmentHead.roles.includes("departmentHead")
    ) {
      throw new Error(
        "The configured email belongs to an inactive user or a user without the departmentHead role. No changes were made."
      );
    }
  } else {
    const passwordHash = await hashPassword(password);

    departmentHead = await User.create({
      name: "SpendFlow Demo Department Head",
      email: normalizedEmail,
      passwordHash,
      roles: ["departmentHead"],
      departmentId: department._id,
      isActive: true,
    });
  }

  department.departmentHeadId = departmentHead._id;
  await department.save();

  console.log(
    "Demo department head setup completed successfully."
  );
  console.log(`Department head email: ${normalizedEmail}`);
  console.log("Engineering department head assigned.");
};

seedDemoDepartmentHead()
  .catch((error) => {
    console.error(
      "Demo department head seeding failed:",
      error.message
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
