import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import MoodChart from "../components/MoodChart";
import { moodMeta } from "../components/MoodCard";

const Analytics = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiReflection, setAiReflection] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [entriesResult, reflectionResult] = await Promise.allSettled([
          api.get("/mood"),
          api.get("/ai/weekly-reflection")
        ]);

        if (entriesResult.status === "fulfilled") {
          setEntries(entriesResult.value.data.entries);
        }

        if (reflectionResult.status === "fulfilled") {
          setAiReflection(reflectionResult.value.data);
        } else {
          setAiError("Unable to prepare AI reflection right now.");
        }
      } finally {
        setLoading(false);
        setAiLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const stats = useMemo(() => {
    const frequency = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});

    const average = entries.length
      ? (entries.reduce((sum, entry) => sum + entry.moodScore, 0) / entries.length).toFixed(1)
      : "0.0";

    const happiest = [...entries].sort((a, b) => b.moodScore - a.moodScore)[0];
    const happiestDay = happiest
      ? new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date(happiest.createdAt))
      : "a future day";

    const weeklyEntries = entries.filter(
      (entry) => Date.now() - new Date(entry.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000
    );
    const previousEntries = entries.filter((entry) => {
      const age = Date.now() - new Date(entry.createdAt).getTime();
      return age > 7 * 24 * 60 * 60 * 1000 && age <= 14 * 24 * 60 * 60 * 1000;
    });
    const avgFor = (items) => (items.length ? items.reduce((sum, entry) => sum + entry.moodScore, 0) / items.length : 0);
    const weeklyTrend = avgFor(weeklyEntries) >= avgFor(previousEntries) ? "improved or stayed steady" : "dipped slightly";

    return { frequency, average, happiestDay, weeklyTrend };
  }, [entries]);

  const weeklyReflection = aiReflection?.reflection?.weeklyReflection;

  return (
    <section className="page-container py-10">
      <h1 className="text-4xl font-black text-ink">Analytics</h1>
      <p className="mt-3 text-ink/65">A simple weekly read on your emotional patterns.</p>

      {loading && <p className="mt-8 text-ink/62">Preparing your chart...</p>}
      {!loading && !entries.length && (
        <div className="card mt-8 p-8 text-center">
          <h2 className="text-2xl font-black">No mood data yet</h2>
          <p className="mt-3 text-ink/62">Analytics become useful after a few mood entries.</p>
        </div>
      )}

      {!!entries.length && (
        <>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="card p-6">
              <h2 className="text-xl font-black">Weekly mood chart</h2>
              <div className="mt-5">
                <MoodChart entries={entries} />
              </div>
            </div>
            <div className="card p-6">
              <h2 className="text-xl font-black">Average mood score</h2>
              <p className="mt-5 text-6xl font-black text-ink">{stats.average}</p>
              <p className="mt-3 text-ink/62">Out of 5 across your saved reflections.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="card p-6">
              <h2 className="text-xl font-black">Mood frequency</h2>
              <div className="mt-5 space-y-3">
                {Object.entries(moodMeta).map(([mood, meta]) => (
                  <div key={mood} className="flex items-center justify-between rounded-2xl bg-mist px-4 py-3">
                    <span className="font-bold">
                      {meta.emoji} {meta.label}
                    </span>
                    <span className="font-black">{stats.frequency[mood] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <h2 className="text-xl font-black">Emotional insights</h2>
              <div className="mt-5 space-y-3 text-ink/72">
                <p className="rounded-2xl bg-rosewater p-4">You felt happiest on {stats.happiestDay}.</p>
                <p className="rounded-2xl bg-mist p-4">Your average mood this week {stats.weeklyTrend}.</p>
                <p className="rounded-2xl bg-lavender/60 p-4">
                  Entries marked favorite can help you revisit moments that felt especially meaningful.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="card mt-8 p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="text-xl font-black">Weekly Reflection</h2>
            <p className="mt-2 text-sm leading-6 text-ink/62">
              AI reflections only use entries you choose to include.
            </p>
          </div>
          {aiReflection?.selectedEntryCount > 0 && (
            <span className="rounded-full bg-sage/15 px-4 py-2 text-sm font-bold text-ink">
              {aiReflection.canGenerate ? "Generated" : "Selected"} from {aiReflection.selectedEntryCount}{" "}
              {aiReflection.selectedEntryCount === 1 ? "entry" : "entries"}
            </span>
          )}
        </div>

        {aiLoading && <p className="mt-6 text-ink/62">Reading your selected entries with care...</p>}
        {aiError && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{aiError}</p>}
        {!aiLoading && !aiError && aiReflection?.status === "no_approved_entries" && (
          <div className="mt-6 rounded-2xl bg-mist p-5 text-ink/70">
            No reflections yet. Entries marked for AI reflection can help MoodMirror notice emotional patterns over time.
          </div>
        )}
        {!aiLoading && !aiError && aiReflection?.status === "insufficient_context" && (
          <div className="mt-6 rounded-2xl bg-mist p-5 text-ink/70">
            <p className="font-bold text-ink">Keep reflecting.</p>
            <p className="mt-2 leading-7">
              MoodMirror needs a little more context before meaningful patterns emerge.
            </p>
            <p className="mt-3 text-sm text-ink/55">
              {aiReflection.selectedEntryCount} selected {aiReflection.selectedEntryCount === 1 ? "entry" : "entries"} ·{" "}
              {aiReflection.totalTextLength} journal characters
            </p>
          </div>
        )}
        {!aiLoading && !aiError && aiReflection && !aiReflection.status && !aiReflection.reflection && (
          <div className="mt-6 rounded-2xl bg-mist p-5 text-ink/70">
            No reflections yet. Entries marked for AI reflection can help MoodMirror notice emotional patterns over time.
          </div>
        )}
        {weeklyReflection && (
          <div className="mt-6 rounded-2xl bg-mist p-6">
            <p className="whitespace-pre-line text-[1.02rem] leading-8 text-ink/78">{weeklyReflection}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Analytics;
