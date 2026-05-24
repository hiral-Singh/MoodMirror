import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import MoodChart from "../components/MoodChart";
import { moodMeta } from "../components/MoodCard";

const Analytics = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const { data } = await api.get("/mood");
        setEntries(data.entries);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
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
    </section>
  );
};

export default Analytics;
