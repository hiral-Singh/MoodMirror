import MoodEntry from "../models/MoodEntry.js";
import { generateReflection } from "../services/openaiReflectionService.js";

export const createReflection = async (req, res) => {
  try {
    const { mood, journal } = req.body;
    const latestEntry = await MoodEntry.findOne({ userId: req.user._id }).sort({ createdAt: -1 });

    const reflection = await generateReflection({
      mood: mood || latestEntry?.mood || "reflective",
      journal: journal || latestEntry?.journal || ""
    });

    return res.status(200).json(reflection);
  } catch (error) {
    return res.status(500).json({ message: "Unable to generate reflection" });
  }
};
