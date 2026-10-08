import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";

const profileRoutes = Router();

profileRoutes.get("/", protect, getProfile);
profileRoutes.put("/", protect, updateProfile);

export default profileRoutes;