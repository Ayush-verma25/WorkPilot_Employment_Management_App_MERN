import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  clockInOut,
  getAttendance,
} from "../controllers/attendanceController.js";

const attendanceRoutes = Router();

attendanceRoutes.post("/", protect, clockInOut);
attendanceRoutes.get("/", protect, getAttendance);

export default attendanceRoutes;
