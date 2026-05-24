import { CalendarDays, NotebookPen, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import MoodChart from "../components/MoodChart";
import { moodMeta } from "../components/MoodCard";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
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

  const latest = entries[0];
  const average = useMemo(() => {
    if (!entries.length) return "0.0";
    return (entries.reduce((sum, entry) => sum + entry.moodScore, 0) / entries.length).toFixed(1);
  }, [entries]);

  return (
    <section className="page-container py-10">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <p className="font-bold text-sage">Dashboard</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Hi, {user?.name}.</h1>
          <p className="mt-2 text-ink/65">A quiet overview of how your days have been feeling.</p>
        </div>
        <Link to="/track" className="btn-primary">
          How are you feeling today?
        </Link>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="card p-5">
          <NotebookPen className="text-sage" />
          <p className="mt-4 text-3xl font-black">{entries.length}</p>
          <p className="text-sm text-ink/58">Total entries</p>
        </div>
        <div className="card p-5">
          <TrendingUp className="text-clay" />
          <p className="mt-4 text-3xl font-black">{average}</p>
          <p className="text-sm text-ink/58">Average mood score</p>
        </div>
        <div className="card p-5">
          <CalendarDays className="text-ink/70" />
          <p className="mt-4 text-3xl font-black">{latest ? moodMeta[latest.mood]?.emoji : "—"}</p>
          <p className="text-sm text-ink/58">Latest mood</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <h2 className="text-xl font-black">Weekly mood chart</h2>
          <div className="mt-5">
            <MoodChart entries={entries} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-black">Recent activity</h2>
          {loading && <p className="mt-5 text-ink/62">Loading your recent reflections...</p>}
          {!loading && !entries.length && <p className="mt-5 text-ink/62">No entries yet. Today is a good place to begin.</p>}
          <div className="mt-5 space-y-4">
            {entries.slice(0, 3).map((entry) => (
              <div key={entry._id} className="rounded-2xl bg-mist p-4">
                <p className="font-bold">
                  {moodMeta[entry.mood]?.emoji} {moodMeta[entry.mood]?.label}
                </p>
                <p className="mt-1 text-sm text-ink/55">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          ["Track mood", "/track", "Log the emotional weather of today."],
          ["View entries", "/entries", "Browse your private mood history."],
          ["Open analytics", "/analytics", "Look for weekly patterns and shifts."]
        ].map(([title, href, text]) => (
          <Link key={title} to={href} className="card block p-5 transition hover:-translate-y-1">
            <Sparkles className="text-sage" size={20} />
            <h3 className="mt-4 text-lg font-black">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/62">{text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Dashboard;
