import express from "express";
import { updateProfile } from "../controllers/profileController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.put("/", auth, updateProfile);

export default router;
