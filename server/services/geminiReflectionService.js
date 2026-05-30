import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

const moodLabels = {
  happy: "happy",
  okay: "okay",
  neutral: "neutral",
  sad: "sad",
  stressed: "stressed"
};

const formatEntryForPrompt = (entry) => ({
  date: new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date(entry.createdAt)),
  mood: moodLabels[entry.mood] || entry.mood,
  moodScore: entry.moodScore,
  journalExcerpt: entry.journal.slice(0, 1200)
});

const buildUnavailableReflection = () => ({
  weeklyReflection: "AI reflection is currently unavailable. Continue reflecting and try again later."
});

const buildPrompt = (entries) => {
  const approvedEntries = entries.map(formatEntryForPrompt);

  return `You are writing a weekly reflection letter for a private mood journaling app.

Only use the approved entries below. The user explicitly chose these entries for AI reflection.

Write as a thoughtful observer and careful reader. The goal is reflection, not coaching.

Focus on:
- emotional shifts across the week
- recurring situations, environments, people, habits, or events
- contradictions or mixed feelings
- tension versus relief
- subtle changes the user might overlook
- natural references to wording or situations from the entries

Avoid:
- counting moods or making the response feel like analytics
- therapy language, diagnosis, mental health claims, or advice
- self-help language, motivational language, or generic positivity
- over-explaining, over-analyzing, or inventing details
- excessive quoting
- dramatic or poetic language for its own sake

Write one continuous reflection of 200 to 300 words. It should feel complete, specific, grounded, and worth reading.

Return valid JSON only in this shape:
{
  "weeklyReflection": "one continuous 200-300 word reflection"
}

Approved entries:
${JSON.stringify(approvedEntries, null, 2)}`;
};

const extractJsonContent = (content) => {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

const parseReflectionResponse = (content, entries) => {
  try {
    const parsed = JSON.parse(extractJsonContent(content));
    const weeklyReflection =
      parsed.weeklyReflection ||
      parsed.weekly_reflection ||
      parsed.reflection?.weeklyReflection ||
      parsed.reflection?.weekly_reflection ||
      parsed.reflection;

    if (typeof weeklyReflection === "string" && weeklyReflection.trim()) {
      return {
        weeklyReflection: weeklyReflection.trim()
      };
    }

    console.warn("Gemini reflection response did not include weeklyReflection:", {
      preview: content.slice(0, 300)
    });

    return buildUnavailableReflection();
  } catch (error) {
    console.warn("Gemini reflection response could not be parsed as JSON:", {
      message: error.message,
      preview: content.slice(0, 300)
    });

    return buildUnavailableReflection();
  }
};

export const generateWeeklyReflection = async ({ entries }) => {
  const plainEntries = entries.map((entry) => entry.toObject?.() || entry);

  if (!process.env.GEMINI_API_KEY) {
    return {
      reflection: buildUnavailableReflection(),
      source: "fallback"
    };
  }

  try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt(plainEntries),
      config: {
        systemInstruction:
          "You write privacy-aware weekly reflection letters. You are a careful mirror, not a therapist, coach, or analytics dashboard.",
        responseMimeType: "application/json",
        temperature: 0.72,
        maxOutputTokens: 2048,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        }
      }
    });

    const content =
      response.text ||
      response.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n") ||
      "{}";

    const reflection = parseReflectionResponse(content, plainEntries);
    const isFallback = reflection.weeklyReflection === buildUnavailableReflection().weeklyReflection;

    return {
      reflection,
      source: isFallback ? "fallback" : "gemini"
    };
  } catch (error) {
    console.error("Gemini reflection generation failed:", {
      model: GEMINI_MODEL,
      message: error.message,
      status: error.status,
      code: error.code
    });

    return {
      reflection: buildUnavailableReflection(),
      source: "fallback"
    };
  }
};
