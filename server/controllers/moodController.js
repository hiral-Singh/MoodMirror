import MoodEntry from "../models/MoodEntry.js";

const moodScores = {
  happy: 5,
  okay: 4,
  neutral: 3,
  sad: 2,
  stressed: 1
};

export const createMoodEntry = async (req, res) => {
  try {
    const { mood, journal, allowAIReflection } = req.body;

    if (!mood || !journal) {
      return res.status(400).json({ message: "Mood and journal reflection are required" });
    }

    if (!Object.hasOwn(moodScores, mood)) {
      return res.status(400).json({ message: "Unsupported mood value" });
    }

    const entry = await MoodEntry.create({
      userId: req.user._id,
      mood,
      moodScore: moodScores[mood],
      journal,
      allowAIReflection: Boolean(allowAIReflection)
    });

    return res.status(201).json({ entry });
  } catch (error) {
    return res.status(500).json({ message: "Unable to save mood entry" });
  }
};

export const getMoodEntries = async (req, res) => {
  try {
    const entries = await MoodEntry.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ entries });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch mood entries" });
  }
};

export const getMoodEntryById = async (req, res) => {
  try {
    const entry = await MoodEntry.findOne({ _id: req.params.id, userId: req.user._id });

    if (!entry) {
      return res.status(404).json({ message: "Mood entry not found" });
    }

    return res.status(200).json({ entry });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch mood entry" });
  }
};

export const updateMoodEntry = async (req, res) => {
  try {
    const allowedUpdates = {};

    if (typeof req.body.isFavorite === "boolean") {
      allowedUpdates.isFavorite = req.body.isFavorite;
    }

    if (typeof req.body.allowAIReflection === "boolean") {
      allowedUpdates.allowAIReflection = req.body.allowAIReflection;
    }

    if (req.body.journal) {
      allowedUpdates.journal = req.body.journal;
    }

    if (req.body.mood && Object.hasOwn(moodScores, req.body.mood)) {
      allowedUpdates.mood = req.body.mood;
      allowedUpdates.moodScore = moodScores[req.body.mood];
    }

    const entry = await MoodEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ message: "Mood entry not found" });
    }

    return res.status(200).json({ entry });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update mood entry" });
  }
};

export const deleteMoodEntry = async (req, res) => {
  try {
    const entry = await MoodEntry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!entry) {
      return res.status(404).json({ message: "Mood entry not found" });
    }

    return res.status(200).json({ message: "Mood entry deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete mood entry" });
  }
};
