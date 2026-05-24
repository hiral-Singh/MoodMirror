import OpenAI from "openai";

const buildFallbackReflection = ({ mood, journal }) => {
  const journalHint = journal ? " Your words suggest there is something worth noticing with patience." : "";
  return `You marked feeling ${mood}. Take a slow moment to name what shaped that feeling today.${journalHint}`;
};

export const generateReflection = async ({ mood, journal }) => {
  if (!process.env.OPENAI_API_KEY) {
    return {
      reflection: buildFallbackReflection({ mood, journal }),
      source: "local-fallback"
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You write short, gentle emotional reflections for a private mood journal. Do not diagnose. Keep it under 70 words."
      },
      {
        role: "user",
        content: `Mood: ${mood}\nJournal: ${journal || "No journal context provided."}`
      }
    ],
    temperature: 0.7,
    max_tokens: 120
  });

  return {
    reflection: response.choices[0]?.message?.content?.trim() || buildFallbackReflection({ mood, journal }),
    source: "openai"
  };
};
