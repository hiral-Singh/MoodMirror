import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import aiRoutes from "./routes/ai.js";
import authRoutes from "./routes/auth.js";
import moodRoutes from "./routes/mood.js";
import profileRoutes from "./routes/profile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

connectDB();

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "MoodMirror API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/ai", aiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ message: "Server error" });
});

app.listen(PORT, () => {
  console.log(`MoodMirror API listening on port ${PORT}`);
});
