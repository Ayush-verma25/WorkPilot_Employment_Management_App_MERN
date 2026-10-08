import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const employeeFields = [
  "firstName", "lastName", "email", "phone", "position", "department",
  "basicSalary", "allowances", "deductions", "employmentStatus", "bio",
];
const salaryFields = ["basicSalary", "allowances", "deductions"];

// Preserve omitted fields and reject values that Mongoose could silently coerce.
const validateInput = (body) => {
  for (const field of [...employeeFields, "password", "role"]) {
    if (body[field] === undefined) continue;
    const value = body[field];
    if (salaryFields.includes(field)) {
      if ((typeof value !== "number" && typeof value !== "string") ||
          String(value).trim() === "" || !Number.isFinite(Number(value))) {
        throw Object.assign(new Error(`Invalid ${field}.`), { status: 400 });
      }
    } else if (typeof value !== "string" || (field !== "bio" && !value.trim())) {
      throw Object.assign(new Error(`Invalid ${field}.`), { status: 400 });
    }
  }
};

const employeeInput = (body) => Object.fromEntries(
  employeeFields.filter((field) => body[field] !== undefined)
    .map((field) => [field, body[field]]),
);

const sendError = (res, error, message) => {
  if (error.code === 11000) {
    return res.status(400).json({ message: "Email already exists." });
  }
  if (error.status || ["ValidationError", "CastError"].includes(error.name)) {
    return res.status(error.status || 400).json({ message: error.message });
  }
  return res.status(500).json({ message });
};

// Get employees
// GET /api/employees
export const getEmployees = async (req, res) => {
  try {
    const { department } = req.query;
    const where = {};
    if (department) where.department = department;

    const employees = await Employee.find(where)
      .sort({ createdAt: -1 })
      .populate("userId", "email role")
      .lean();

    const result = employees.map((emp) => ({
      ...emp,
      id: emp._id.toString(),
      user: emp.userId
        ? { email: emp.userId.email, role: emp.userId.role }
        : null,
    }));
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get employees." });
  }
};

// Create employee
// POST /api/employees
export const createEmployee = async (req, res) => {
  try {
    if (typeof req.body.password !== "string" || !req.body.password.trim()) {
      return res.status(400).json({ message: "A non-empty password is required." });
    }
    validateInput(req.body);
    const user = new User({
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    });
    const employee = new Employee({
      ...employeeInput(req.body),
      userId: user._id,
      email: user.email,
      department: req.body.department ?? "Engineering",
      joinDate: req.body.joinDate,
    });

    // Validate both documents before the first write, including required fields,
    // dates, numeric casts, and enum values.
    await user.validate();
    await employee.validate();
    user.password = await bcrypt.hash(req.body.password, 10);

    await mongoose.connection.transaction(async (session) => {
      await user.save({ session });
      await employee.save({ session });
    });
    return res.status(201).json({ success: true, employee });
  } catch (error) {
    return sendError(res, error, "Failed to create employee.");
  }
};

// Update employee
// PUT /api/employees/:id
export const updateEmployee = async (req, res) => {
  try {
    validateInput(req.body);
    const changes = employeeInput(req.body);
    const userChanges = {};
    if (req.body.email !== undefined) userChanges.email = req.body.email;
    if (req.body.role !== undefined) userChanges.role = req.body.role;
    if (req.body.password !== undefined) {
      userChanges.password = await bcrypt.hash(req.body.password, 10);
    }

    await mongoose.connection.transaction(async (session) => {
      const employee = await Employee.findById(req.params.id).session(session);
      if (!employee) {
        throw Object.assign(new Error("Employee not found."), { status: 404 });
      }
      const user = await User.findById(employee.userId).session(session);
      if (!user) {
        throw Object.assign(new Error("Linked user not found."), { status: 404 });
      }
      user.set(userChanges);
      if (req.body.email !== undefined) {
        changes.email = user.email;
        userChanges.email = user.email;
      }
      employee.set(changes);
      await user.validate();
      await employee.validate();

      await Employee.findByIdAndUpdate(employee._id, changes, {
        session, runValidators: true,
      });
      await User.findByIdAndUpdate(user._id, userChanges, {
        session, runValidators: true,
      });
    });
    return res.json({ success: true });
  } catch (error) {
    return sendError(res, error, "Failed to update employee.");
  }
};

// Delete employee
// DELETE /api/employees/:id
export const deleteEmployee = async (req, res) => {
  try {
    await mongoose.connection.transaction(async (session) => {
      const employee = await Employee.findById(req.params.id).session(session);
      if (!employee) {
        throw Object.assign(new Error("Employee not found."), { status: 404 });
      }
      employee.isDeleted = true;
      employee.employmentStatus = "INACTIVE";
      await employee.save({ session });
      const user = await User.findByIdAndUpdate(employee.userId, {
        isDisabled: true,
      }, { session, runValidators: true });
      if (!user) {
        throw Object.assign(new Error("Linked user not found."), { status: 404 });
      }
    });
    return res.json({ success: true });
  } catch (error) {
    return sendError(res, error, "Failed to delete employee.");
  }
};
