import express from "express";
import { createReflection } from "../controllers/aiController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/reflection", auth, createReflection);

export default router;
