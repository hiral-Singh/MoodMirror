import express from "express";
import { getProfile, login, logout, register } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", auth, getProfile);

export default router;
