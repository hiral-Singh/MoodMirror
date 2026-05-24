import { useEffect, useState } from "react";
import api from "../api/axios";
import MoodCard from "../components/MoodCard";

const Entries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEntries = async () => {
    try {
      const { data } = await api.get("/mood");
      setEntries(data.entries);
    } catch (err) {
      setError("Unable to load entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id) => {
    await api.delete(`/mood/${id}`);
    setEntries((current) => current.filter((entry) => entry._id !== id));
  };

  const handleFavorite = async (entry) => {
    const { data } = await api.patch(`/mood/${entry._id}`, { isFavorite: !entry.isFavorite });
    setEntries((current) => current.map((item) => (item._id === entry._id ? data.entry : item)));
  };

  return (
    <section className="page-container py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-black text-ink">Mood entries</h1>
          <p className="mt-3 text-ink/65">Your private archive of daily check-ins.</p>
        </div>
      </div>

      {error && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-700">{error}</p>}
      {loading && <p className="mt-8 text-ink/62">Loading entries...</p>}
      {!loading && !entries.length && (
        <div className="card mt-8 p-8 text-center">
          <h2 className="text-2xl font-black">No entries yet</h2>
          <p className="mt-3 text-ink/62">Once you log a mood, it will appear here with its date and preview.</p>
        </div>
      )}
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <MoodCard key={entry._id} entry={entry} onDelete={handleDelete} onFavorite={handleFavorite} />
        ))}
      </div>
    </section>
  );
};

export default Entries;
