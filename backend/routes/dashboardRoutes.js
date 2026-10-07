import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getDashboard } from "../controllers/dashboardController.js";

const dashboardRoutes = Router();

dashboardRoutes.get("/", protect, getDashboard);

export default dashboardRoutes;