import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const openRecord = await Attendance.findOne({
      employeeId: employee._id,
      checkIn: { $ne: null },
      checkOut: null,
    });
    const existing = openRecord ?? await Attendance.findOne({
      employeeId: employee._id,
      date: today,
    });

    const now = new Date();

    if (!existing) {
      if (action === "CHECK_OUT") {
        return res.status(400).json({ message: "No attendance to check out." });
      }
      const isLate = now.getHours() > 9 ||
        (now.getHours() === 9 && now.getMinutes() > 0);
      const attendance = await Attendance.create({
        employeeId: employee._id,
        date: today,
        checkIn: now,
        status: isLate ? "LATE" : "PRESENT",
      });
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
      if (workingHours >= 8) dayType = "Full Day";
      else if (workingHours >= 6) dayType = "Three Quarter Day";
      else if (workingHours >= 4) dayType = "Half Day";
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
    const history = await Attendance.find({ employeeId: employee._id })
      .sort({ date: -1 })
      .limit(limit);

    return res.json({
      data: history,
      employee: { isDeleted: employee.isDeleted },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch attendance." });
  }
};
