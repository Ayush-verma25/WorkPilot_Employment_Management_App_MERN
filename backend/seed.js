import "dotenv/config";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const TemporaryPassword = "admin123";

async function registerAdmin() {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!ADMIN_EMAIL) {
      console.error("Missing ADMIN_EMAIL environment variable");
      process.exitCode = 1;
      return;
    }

    await connectDB();

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log("User already exists as role", existingAdmin.role);
      return;
    }

    const hashedPassword = await bcrypt.hash(TemporaryPassword, 10);

    const admin = await User.create({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("Admin user created");
    console.log("\nemail:", admin.email);
    console.log("password:", TemporaryPassword);
    console.log("\nchange the password after login");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

registerAdmin();