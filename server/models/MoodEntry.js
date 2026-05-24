import mongoose from "mongoose";

const moodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    mood: {
      type: String,
      required: true,
      enum: ["happy", "okay", "neutral", "sad", "stressed"]
    },
    moodScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    journal: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    isFavorite: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const MoodEntry = mongoose.model("MoodEntry", moodEntrySchema);

export default MoodEntry;
