import "dotenv/config";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

async function registerAdmin() {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_EMAIL) {
      console.error("Missing ADMIN_EMAIL environment variable");
      process.exitCode = 1;
      return;
    }
    if (typeof ADMIN_PASSWORD !== "string" || !ADMIN_PASSWORD.trim()) {
      console.error("Missing ADMIN_PASSWORD environment variable");
      process.exitCode = 1;
      return;
    }

    await connectDB();

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log("User already exists as role", existingAdmin.role);
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = await User.create({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("Admin user created");
    console.log("\nemail:", admin.email);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

registerAdmin();