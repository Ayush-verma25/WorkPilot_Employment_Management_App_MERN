import { DEPARTMENTS } from "../constants/departments.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/PaySlip.js";

const getIndiaDateParts = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type).value;
  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
  };
};

// Get deshboard for employee and admin
// GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const session = req.session;
    if (session.user.role === "ADMIN") {
      const { year, month, day } = getIndiaDateParts(new Date());
      const todayStart = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
      const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const [totalEmployees, todayAttendance, pendingLeaves] =
        await Promise.all([
          Employee.countDocuments({ isDeleted: { $ne: true } }),
          Attendance.countDocuments({
            date: { $gte: todayStart, $lt: tomorrowStart },
          }),
          LeaveApplication.countDocuments({ status: "PENDING" }),
        ]);

      return res.status(200).json({
        role: "ADMIN",
        totalEmployees,
        totalDepartments: DEPARTMENTS.length,
        todayAttendance,
        pendingLeaves,
      });
    } else {
      const employee = await Employee.findOne({
        userId: session.user.id,
      }).lean();
      if (!employee)
        return res.status(404).json({ error: "Employee not found" });

      const { year, month } = getIndiaDateParts(new Date());
      const monthStart = new Date(`${year}-${month}-01T00:00:00+05:30`);
      const monthEnd = new Date(
        Date.UTC(Number(year), Number(month), 1) - 330 * 60 * 1000,
      );
      const [currentMonthAttendance, pendingLeaves, latestPayslip] =
        await Promise.all([
          Attendance.countDocuments({
            employeeId: employee._id,
            date: { $gte: monthStart, $lt: monthEnd },
          }),
          LeaveApplication.countDocuments({
            employeeId: employee._id,
            status: "PENDING",
          }),
          Payslip.findOne({ employeeId: employee._id })
            .sort({ createdAt: -1 })
            .lean(),
        ]);

      return res.json({
        role: "EMPLOYEE",
        employee: { ...employee, id: employee._id.toString() },
        currentMonthAttendance,
        pendingLeaves,
        latestPayslip: latestPayslip
          ? { ...latestPayslip, id: latestPayslip._id.toString() }
          : null,
      });
    }
  } catch (error) {
    console.error("Dashboard Error", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
