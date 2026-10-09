import express from "express";
import cors from "cors";
import "dotenv/config";
import multer from "multer";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import payslipsRoutes from "./routes/payslipsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

const app = express();

const PORT = process.env.PORT || 7000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(multer().none());
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("API database connection failed:", error.message);
    res.status(503).json({ message: "Database unavailable." });
  }
});
app.use("/api/inngest", serve({ client: inngest, functions }));

// Routes
app.get("/", (req, res) => res.send("Server is up and running"));
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/payslips", payslipsRoutes);
app.use("/api/dashboard", dashboardRoutes);

if (!process.env.VERCEL) {
 connectDB()
   .then(() => {
     app.listen(PORT, () => {
       console.log(`Server is running on port ${PORT}`);
     });
   })
   .catch((error) => {
     console.error("Server startup failed:", error.message);
     process.exitCode = 1;
   });
}

export default app;
