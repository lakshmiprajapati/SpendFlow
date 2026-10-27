
import Department from "../models/Department.js";


export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .select("_id name code")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};
