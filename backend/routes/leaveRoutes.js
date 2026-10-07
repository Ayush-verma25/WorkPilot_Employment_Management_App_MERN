import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import {
  createLeave,
  getLeaves,
  updateLeaveStatus,
} from "../controllers/leaveController.js";

const leaveRoutes = Router();

leaveRoutes.post("/", protect, createLeave);
leaveRoutes.get("/", protect, getLeaves);
leaveRoutes.patch("/:id", protect, protectAdmin, updateLeaveStatus);

export default leaveRoutes;
