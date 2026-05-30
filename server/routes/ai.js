import express from "express";
import { createReflection, getWeeklyReflection } from "../controllers/aiController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/weekly-reflection", auth, getWeeklyReflection);
router.post("/reflection", auth, createReflection);

export default router;
