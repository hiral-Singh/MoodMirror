import MoodEntry from "../models/MoodEntry.js";
import { generateWeeklyReflection } from "../services/geminiReflectionService.js";

const MIN_APPROVED_ENTRIES = 3;
const MIN_TOTAL_TEXT_LENGTH = 500;

const getApprovedWeeklyEntries = async (userId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return MoodEntry.find({
    userId,
    allowAIReflection: true,
    createdAt: { $gte: sevenDaysAgo }
  })
    .sort({ createdAt: 1 })
    .select("mood moodScore journal createdAt");
};

const getReflectionMetadata = (entries) => {
  const totalTextLength = entries.reduce((sum, entry) => sum + (entry.journal?.trim().length || 0), 0);
  const selectedEntryCount = entries.length;
  const canGenerate = selectedEntryCount >= MIN_APPROVED_ENTRIES || totalTextLength >= MIN_TOTAL_TEXT_LENGTH;

  return {
    canGenerate,
    selectedEntryCount,
    entryCount: selectedEntryCount,
    totalTextLength,
    thresholds: {
      minApprovedEntries: MIN_APPROVED_ENTRIES,
      minTotalTextLength: MIN_TOTAL_TEXT_LENGTH
    }
  };
};

const buildWeeklyReflectionResponse = async (userId) => {
  const entries = await getApprovedWeeklyEntries(userId);
  const metadata = getReflectionMetadata(entries);

  if (!entries.length) {
    return {
      reflection: null,
      source: "none",
      status: "no_approved_entries",
      ...metadata,
      message:
        "No reflections yet. Entries marked for AI reflection can help MoodMirror notice emotional patterns over time."
    };
  }

  if (!metadata.canGenerate) {
    return {
      reflection: null,
      source: "insufficient-context",
      status: "insufficient_context",
      ...metadata,
      message: "Keep reflecting. MoodMirror needs a little more context before meaningful patterns emerge."
    };
  }

  const reflection = await generateWeeklyReflection({ entries });

  return {
    ...reflection,
    status: "ready",
    ...metadata
  };
};

export const getWeeklyReflection = async (req, res) => {
  try {
    const reflection = await buildWeeklyReflectionResponse(req.user._id);
    return res.status(200).json(reflection);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to generate weekly reflection" });
  }
};

export const createReflection = async (req, res) => {
  try {
    const reflection = await buildWeeklyReflectionResponse(req.user._id);
    return res.status(200).json(reflection);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to generate weekly reflection" });
  }
};
