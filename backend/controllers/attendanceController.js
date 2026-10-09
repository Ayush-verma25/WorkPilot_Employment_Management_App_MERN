import { inngest } from "../inngest/index.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

const getIndiaDateParts = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type).value;
  return {
    dateKey: `${part("year")}-${part("month")}-${part("day")}`,
  };
};

const getIndiaTime = (date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type) => Number(parts.find((item) => item.type === type).value);
  return { hour: part("hour"), minute: part("minute") };
};

// Clock in/out for employee
// POST /api/attendance with action: CHECK_IN (default) or CHECK_OUT
export const clockInOut = async (req, res) => {
  try {
    const action = req.body?.action ?? "CHECK_IN";
    if (!["CHECK_IN", "CHECK_OUT"].includes(action)) {
      return res.status(400).json({ message: "Invalid attendance action." });
    }
    const session = req.session;
    const employee = await Employee.findOne({ userId: session.userId });
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });

    if (employee.isDeleted)
      return res.status(403).json({
        error: "Your account is deactivated. you can't clock in/out.",
      });

    const now = new Date();
    const { dateKey } = getIndiaDateParts(now);
    const today = new Date(`${dateKey}T00:00:00+05:30`);

    const openRecord = await Attendance.findOne({
      employeeId: employee._id,
      checkIn: { $ne: null },
      checkOut: null,
    });
    const existing =
      openRecord ??
      (await Attendance.findOne({
        employeeId: employee._id,
        date: today,
      }));

    if (!existing) {
      if (action === "CHECK_OUT") {
        return res.status(400).json({ message: "No attendance to check out." });
      }
      const { hour, minute } = getIndiaTime(now);
      const isLate = hour > 9 || (hour === 9 && minute > 0);
      let attendance;
      try {
        attendance = await Attendance.create({
          employeeId: employee._id,
          date: today,
          checkIn: now,
          status: isLate ? "LATE" : "PRESENT",
        });

        await inngest.send({
          name: "employee/check-out",
          data: {
            employeeId: employee._id,
            attendanceId: attendance._id,
          },
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        attendance = await Attendance.findOne({
          employeeId: employee._id,
          date: today,
        });
        if (!attendance) throw error;
      }
      return res.json({ success: true, type: "CHECK_IN", data: attendance });
    } else if (action === "CHECK_IN" || existing.checkOut) {
      return res.json({
        success: true,
        type: existing.checkOut ? "CHECK_OUT" : "CHECK_IN",
        data: existing,
      });
    } else {
      const checkInTime = new Date(existing.checkIn).getTime();
      const diffMs = now.getTime() - checkInTime;
      const diffHours = diffMs / (1000 * 60 * 60);

      existing.checkOut = now;

      // Compute working hours and day type
      const workingHours = parseFloat(diffHours.toFixed(2));
      let dayType = "Half Day";
      if (diffHours >= 8) dayType = "Full Day";
      else if (diffHours >= 4) dayType = "Half Day";
      else dayType = "Short Day";

      existing.workingHours = workingHours;
      existing.dayType = dayType;

      await existing.save();
      return res.json({ success: true, type: "CHECK_OUT", data: existing });
    }
  } catch (error) {
    console.error("Attendance error:", error);
    return res.status(500).json({ message: "Operation failed." });
  }
};

// Get attendance for employee
// GET /api/attendance/
export const getAttendance = async (req, res) => {
  try {
    const session = req.session;
    const employee = await Employee.findOne({ userId: session.userId });
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });

    const limit = Number(req.query.limit) || 30;
    const [history, openAttendance] = await Promise.all([
      Attendance.find({ employeeId: employee._id })
        .sort({ date: -1 })
        .limit(limit),
      Attendance.findOne({
        employeeId: employee._id,
        checkIn: { $ne: null },
        checkOut: null,
      }).sort({ checkIn: -1 }),
    ]);

    return res.json({
      data: history,
      openAttendance,
      employee: { isDeleted: employee.isDeleted },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch attendance." });
  }
};
