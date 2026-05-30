import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { moodMeta } from "../components/MoodCard";

const moods = ["happy", "okay", "neutral", "sad", "stressed"];

const MoodTracker = () => {
  const navigate = useNavigate();
  const [mood, setMood] = useState("okay");
  const [journal, setJournal] = useState("");
  const [allowAIReflection, setAllowAIReflection] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/mood", { mood, journal, allowAIReflection });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save mood");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-container py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black text-ink">How are you feeling today?</h1>
        <p className="mt-3 text-ink/65">Choose the closest fit, then give your future self a little context.</p>

        <form onSubmit={handleSubmit} className="card mt-8 p-6">
          {error && <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {moods.map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setMood(value)}
                className={`rounded-2xl border p-4 text-center transition ${
                  mood === value ? "border-ink bg-ink text-white" : "border-ink/10 bg-white hover:border-sage"
                }`}
              >
                <span className="block text-3xl">{moodMeta[value].emoji}</span>
                <span className="mt-2 block text-sm font-black">{moodMeta[value].label}</span>
              </button>
            ))}
          </div>

          <label className="mt-6 block text-sm font-bold text-ink/72">
            Journal reflection
            <textarea
              className="form-input mt-2 min-h-44 resize-y leading-7"
              value={journal}
              onChange={(event) => setJournal(event.target.value)}
              placeholder="What shaped this feeling today?"
              required
            />
          </label>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-mist p-4 text-sm text-ink/72">
            <input
              type="checkbox"
              checked={allowAIReflection}
              onChange={(event) => setAllowAIReflection(event.target.checked)}
              className="mt-1 h-4 w-4 accent-ink"
            />
            <span>
              <span className="block font-black text-ink">Include this entry in AI reflections</span>
              <span className="mt-1 block leading-6">
                MoodMirror only uses entries you explicitly choose for weekly AI reflections.
              </span>
            </span>
          </label>
          <button className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? "Saving..." : "Save mood entry"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default MoodTracker;
