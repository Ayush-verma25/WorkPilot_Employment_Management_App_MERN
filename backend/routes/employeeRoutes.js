import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from "../controllers/employeeController.js";
import { protect, protectAdmin } from "../middleware/auth.js";

const employeeRoutes = Router();

employeeRoutes.get("/", protect, protectAdmin, getEmployees);
employeeRoutes.post("/", protect, protectAdmin, createEmployee);
employeeRoutes.put("/:id", protect, protectAdmin, updateEmployee);
employeeRoutes.delete("/:id", protect, protectAdmin, deleteEmployee);

export default employeeRoutes;
