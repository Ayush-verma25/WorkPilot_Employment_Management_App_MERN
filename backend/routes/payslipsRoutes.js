import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import {
  createPayslip,
  getPayslipById,
  getPayslips,
} from "../controllers/payslipController.js";

const payslipsRoutes = Router();

payslipsRoutes.post("/", protect, protectAdmin, createPayslip);
payslipsRoutes.get("/", protect, getPayslips);
payslipsRoutes.get("/:id", protect, getPayslipById);

export default payslipsRoutes;
