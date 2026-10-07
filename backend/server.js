import express from "express";
import cors from "cors";
import "dotenv/config";
import multer from "multer";
import connectDB from "./config/db.js";

const app = express();

const PORT = process.env.PORT || 7000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(multer().none());

// Routes
app.get("/", (req, res) => res.send("Server is up and running"));
await connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
