import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { moodMeta } from "../components/MoodCard";

const EntryDetails = () => {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const { data } = await api.get(`/mood/${id}`);
        setEntry(data.entry);
      } catch (err) {
        setError("Unable to load this entry");
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id]);

  if (loading) return <section className="page-container py-10 text-ink/62">Loading entry...</section>;
  if (error) return <section className="page-container py-10 text-red-700">{error}</section>;

  const meta = moodMeta[entry.mood];

  return (
    <section className="page-container py-10">
      <Link to="/entries" className="font-bold text-ink/62 hover:text-ink">Back to entries</Link>
      <article className="card mt-6 p-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-bold ${meta.color}`}>
              <span>{meta.emoji}</span>
              {meta.label}
            </span>
            <h1 className="mt-5 text-3xl font-black">Journal reflection</h1>
            <p className="mt-2 text-ink/55">{new Date(entry.createdAt).toLocaleString()}</p>
          </div>
          <p className="text-3xl" title={entry.isFavorite ? "Favorite" : "Not favorite"}>
            {entry.isFavorite ? "★" : "☆"}
          </p>
        </div>
        <div className="mt-8 whitespace-pre-wrap rounded-2xl bg-mist p-6 leading-8 text-ink/78">{entry.journal}</div>
      </article>
    </section>
  );
};

export default EntryDetails;
