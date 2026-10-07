import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";

const parseDateOnly = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
};

const getTodayInIndia = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};

// Create leave application
// Post /api/leaves
export const createLeave = async (req, res) => {
  try {
    const session = req.session;
    const employee = await Employee.findOne({ userId: session.userId });

    if (!employee)
      return res.status(404).json({ message: "Employee not found." });

    if (employee.isDeleted) {
      return res.status(403).json({
        error: "Your account is deactivated. you can't apply for leave.",
      });
    }

    const { type, startDate, endDate, reason } = req.body;

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: "Please fill all the fields." });
    }

    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    const today = getTodayInIndia();
    if (!start || !end || startDate <= today || endDate <= today) {
      return res
        .status(400)
        .json({ message: "Start date and end date should be in the future." });
    }

    if (endDate < startDate) {
      return res
        .status(400)
        .json({ message: "End date should be after start date." });
    }

    const leave = await LeaveApplication.create({
      employeeId: employee._id,
      type,
      startDate: start,
      endDate: end,
      reason,
      status: "PENDING",
    });

    return res.json({ success: true, date: leave });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to create leave application." });
  }
};

//Get Leaves
// GET /api/leaves
export const getLeaves = async (req, res) => {
  try {
    const session = req.session;

    const isAdmin = session.role === "ADMIN";
    if (isAdmin) {
      const status = req.query.status;
      const where = status ? { status } : {};
      const leaves = await LeaveApplication.find(where)
        .populate("employeeId")
        .sort({ startDate: -1 });
      const data = leaves.map((l) => {
        const obj = l.toObject();
        return {
          ...obj,
          id: l._id.toString(),
          employee: obj.employeeId,
          employeeId: obj.employeeId?._id?.toString(),
        };
      });

      return res.json({ data });
    } else {
      const employee = await Employee.findOne({
        userId: session.userId,
      }).lean();
      if (!employee)
        return res.status(404).json({ message: "Employee not found." });
      const leaves = await LeaveApplication.find({
        employeeId: employee._id,
      }).sort({ createdAt: -1 });
      return res.json({
        data: leaves,
        employee: { ...employee, id: employee._id.toString() },
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Failed to get leaves." });
  }
};

// Update leave status
// PUT /api/leaves/:id
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const leave = await LeaveApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" },
    );
    if (!leave) {
      return res.status(404).json({ error: "Leave application not found." });
    }
    return res.json({ success: true, leave });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update leave status." });
  }
};
