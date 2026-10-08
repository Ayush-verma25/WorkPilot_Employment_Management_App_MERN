import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";

// Create payslip
// POST /api/payslips
export const createPayslip = async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, allowances, deductions } =
      req.body;

    if (!employeeId || month === undefined || year === undefined ||
        basicSalary === undefined) {
      return res.status(400).json({ message: "Please fill all the fields." });
    }

    const toNumber = (value) =>
      (typeof value === "number" ||
        (typeof value === "string" && value.trim() !== "")) &&
      Number.isFinite(Number(value))
        ? Number(value)
        : NaN;
    const numericMonth = toNumber(month);
    const numericYear = toNumber(year);
    const numericBasicSalary = toNumber(basicSalary);
    const numericAllowances =
      allowances === undefined ? 0 : toNumber(allowances);
    const numericDeductions =
      deductions === undefined ? 0 : toNumber(deductions);
    if (
      !Number.isInteger(numericMonth) ||
      numericMonth < 1 ||
      numericMonth > 12 ||
      !Number.isInteger(numericYear) ||
      numericYear < 1 ||
      [numericBasicSalary, numericAllowances, numericDeductions].some(
        (amount) => !Number.isFinite(amount) || amount < 0,
      )
    ) {
      return res.status(400).json({ message: "Invalid payroll period or amount." });
    }
    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({ message: "Invalid employee." });
    }
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const netSalary =
      numericBasicSalary + numericAllowances - numericDeductions;

    const payslip = await Payslip.create({
      employeeId,
      month: numericMonth,
      year: numericYear,
      basicSalary: numericBasicSalary,
      allowances: numericAllowances,
      deductions: numericDeductions,
      netSalary,
    });

    return res.json({ success: true, data: payslip });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A payslip already exists for this employee and period.",
      });
    }
    return res.status(500).json({ message: "Failed to create payslip." });
  }
};

// Get payslips
// GET /api/payslips
export const getPayslips = async (req, res) => {
  try {
    const session = req.session;

    const isAdmin = session.role === "ADMIN";
    if (isAdmin) {
      const payslips = await Payslip.find()
        .populate("employeeId")
        .sort({ createdAt: -1 });
      const data = payslips.map((p) => {
        const obj = p.toObject();
        return {
          ...obj,
          id: obj._id.toString(),
          employee: obj.employeeId,
          employeeId: obj.employeeId?._id?.toString(),
        };
      });
      return res.json({ data });
    } else {
      const employee = await Employee.findOne({ userId: session.userId });
      if (!employee)
        return res.status(404).json({ message: "Employee not found." });
      const payslips = await Payslip.find({ employeeId: employee._id }).sort({
        createdAt: -1,
      });
      return res.json({ data: payslips });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to get payslips." });
  }
};

// Get payslip by ID
// GET /api/payslips/:id
export const getPayslipById = async (req, res) => {
  try {
    const where = { _id: req.params.id };
    if (req.session.role !== "ADMIN") {
      const employee = await Employee.findOne({ userId: req.session.userId });
      if (!employee) {
        return res.status(404).json({ message: "Employee not found." });
      }
      where.employeeId = employee._id;
    }

    const payslip = await Payslip.findOne(where)
      .populate("employeeId")
      .lean();

    if (!payslip)
      return res.status(404).json({ message: "Payslip not found." });

    const result = {
      ...payslip,
      id: payslip._id.toString(),
      employeeId: payslip.employeeId,
    };
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get payslip." });
  }
};
