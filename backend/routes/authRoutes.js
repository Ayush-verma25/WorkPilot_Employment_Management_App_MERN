import { Router } from "express";
import {
  changePassword,
  login,
  session,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const authRoutes = Router();

authRoutes.post("/login", login);
authRoutes.get("/session", protect, session);
authRoutes.post("/change-password", protect, changePassword);

export default authRoutes;
