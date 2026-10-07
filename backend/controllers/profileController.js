import Employee from "../models/Employee.js";

// Get profile
// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const session = req.session;
    const employee = await Employee.findOne({ userId: session.userId });

    if (!employee) {
      // Authenticated user is not an employee - return admin profile
      return res.json({
        firstName: "Admin",
        lastName: "",
        email: session.email,
      });
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
    const employee = await Employee.findOne({ userId: session.userId });
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });
    if (employee.isDeleted) {
      return res.status(403).json({
        error: "Your account is deactivated. you can't update your profile.",
      });
    }
    if (req.body.bio !== undefined && typeof req.body.bio !== "string") {
      return res.status(400).json({ error: "Bio must be a string." });
    }
    await Employee.findByIdAndUpdate(employee._id, {
      bio: req.body.bio,
    }, { runValidators: true });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
};
