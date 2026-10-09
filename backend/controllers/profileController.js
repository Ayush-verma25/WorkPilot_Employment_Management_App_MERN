import Employee from "../models/Employee.js";
import User from "../models/User.js";

// Get profile
// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const session = req.session;
    if (session.role === "ADMIN") {
      const user = await User.findById(session.userId).select("email role bio");
      if (!user || user.role !== "ADMIN") {
        return res.status(404).json({ message: "Admin profile not found." });
      }
      return res.json({
        _id: user._id,
        firstName: "Admin",
        lastName: "",
        email: user.email,
        role: user.role,
        bio: user.bio,
      });
    }

    const employee = await Employee.findOne({ userId: session.userId });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found." });
    }
    if (employee.isDeleted) {
      return res.status(403).json({ message: "Your account is deactivated." });
    }
    return res.json(employee);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// Update profile
// PUT /api/profile
export const updateProfile = async (req, res) => {
  try {
    const session = req.session;
    if (req.body?.bio !== undefined && typeof req.body.bio !== "string") {
      return res.status(400).json({ error: "Bio must be a string." });
    }

    if (session.role === "ADMIN") {
      const user = await User.findOneAndUpdate(
        { _id: session.userId, role: "ADMIN" },
        { bio: req.body.bio },
        { returnDocument: "after", runValidators: true },
      );
      if (!user) {
        return res.status(404).json({ message: "Admin profile not found." });
      }
      return res.json({ success: true });
    }

    const employee = await Employee.findOne({ userId: session.userId });
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });
    if (employee.isDeleted) {
      return res.status(403).json({
        error: "Your account is deactivated. you can't update your profile.",
      });
    }
    await Employee.findByIdAndUpdate(employee._id, {
      bio: req.body.bio,
    }, { runValidators: true });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
};
