import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET } from "../config/auth.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    const session = jwt.verify(token, JWT_SECRET);

    if (!session || typeof session !== "object" || !session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(session.userId).select("email role isDisabled");
    if (!user || user.isDisabled) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Authorization uses the current persisted role, including for existing tokens.
    req.session = { ...session, role: user.role, email: user.email };
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const protectAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN" || req.user.isDisabled) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
