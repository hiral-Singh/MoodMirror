import express from "express";
import {
  createMoodEntry,
  deleteMoodEntry,
  getMoodEntries,
  getMoodEntryById,
  updateMoodEntry
} from "../controllers/moodController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);
router.post("/", createMoodEntry);
router.get("/", getMoodEntries);
router.get("/:id", getMoodEntryById);
router.patch("/:id", updateMoodEntry);
router.delete("/:id", deleteMoodEntry);

export default router;
