
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Department from "../models/Department.js";
import Budget from "../models/Budget.js";

const seedDemoBudget = async () => {
  try {
    await connectDB();

    const department = await Department.findOne({
      code: "ENG",
      isActive: true,
    });

    if (!department) {
      throw new Error(
        "Active Engineering department (ENG) not found"
      );
    }

    const existingBudget = await Budget.findOne({
      departmentId: department._id,
      fiscalYear: "2026-27",
    });

    if (existingBudget) {
      console.log("Budget already exists. No changes made.");
      console.log({
        fiscalYear: existingBudget.fiscalYear,
        allocatedPaise: existingBudget.allocatedPaise,
        committedPaise: existingBudget.committedPaise,
      });
      return;
    }

    const budget = await Budget.create({
      departmentId: department._id,
      fiscalYear: "2026-27",
      allocatedPaise: 50000000,
      committedPaise: 0,
      currency: "INR",
    });

    console.log("Demo budget created successfully.");
    console.log({
      department: department.name,
      fiscalYear: budget.fiscalYear,
      allocatedRupees: budget.allocatedPaise / 100,
      committedRupees: budget.committedPaise / 100,
      remainingRupees:
        (budget.allocatedPaise - budget.committedPaise) / 100,
    });
  } catch (error) {
    console.error("Budget seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDemoBudget();
