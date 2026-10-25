
import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { hashPassword } from "../utils/password.js";

const seedDemoFinanceApprover = async () => {
  const email = process.env.DEMO_FINANCE_APPROVER_EMAIL;
  const password = process.env.DEMO_FINANCE_APPROVER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set DEMO_FINANCE_APPROVER_EMAIL and DEMO_FINANCE_APPROVER_PASSWORD in backend/.env"
    );
  }

  if (password.length < 12) {
    throw new Error(
      "Demo Finance Approver password must be at least 12 characters long"
    );
  }

  await connectDB();

  const department = await Department.findOne({ code: "ENG" });

  if (!department || !department.isActive) {
    throw new Error("Active Engineering department was not found");
  }

  const normalizedEmail = email.trim().toLowerCase();

  let financeApprover = await User.findOne({
    email: normalizedEmail,
  });

  if (financeApprover) {
    if (
      !financeApprover.isActive ||
      !financeApprover.roles.includes("financeApprover")
    ) {
      throw new Error(
        "The configured email already belongs to an inactive user or a user without the financeApprover role. No changes were made."
      );
    }
  } else {
    const passwordHash = await hashPassword(password);

    financeApprover = await User.create({
      name: "SpendFlow Demo Finance Approver",
      email: normalizedEmail,
      passwordHash,
      roles: ["financeApprover"],
      departmentId: department._id,
      isActive: true,
    });
  }

  // Assign the Finance Approver to the Engineering department.
  department.financeApproverId = financeApprover._id;
  await department.save();

  console.log("Demo Finance Approver setup completed successfully.");
  console.log(`Finance Approver email: ${normalizedEmail}`);
  console.log("Engineering department Finance Approver assigned.");
};

seedDemoFinanceApprover()
  .catch((error) => {
    console.error(
      "Demo Finance Approver seeding failed:",
      error.message
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
