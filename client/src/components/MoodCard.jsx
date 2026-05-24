import { Link } from "react-router-dom";

export const moodMeta = {
  happy: { emoji: "😄", label: "Happy", color: "bg-emerald-50 text-emerald-900" },
  okay: { emoji: "🙂", label: "Okay", color: "bg-sage/15 text-ink" },
  neutral: { emoji: "😐", label: "Neutral", color: "bg-slate-100 text-slate-800" },
  sad: { emoji: "😔", label: "Sad", color: "bg-lavender/60 text-ink" },
  stressed: { emoji: "😣", label: "Stressed", color: "bg-rosewater text-ink" }
};

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(date));

const MoodCard = ({ entry, onDelete, onFavorite }) => {
  const meta = moodMeta[entry.mood] || moodMeta.neutral;
  const preview = entry.journal.length > 110 ? `${entry.journal.slice(0, 110)}...` : entry.journal;

  return (
    <article className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${meta.color}`}>
            <span>{meta.emoji}</span>
            {meta.label}
          </span>
          <p className="mt-3 text-sm text-ink/55">{formatDate(entry.createdAt)}</p>
        </div>
        <button
          onClick={() => onFavorite(entry)}
          className="text-xl"
          title={entry.isFavorite ? "Remove favorite" : "Mark favorite"}
        >
          {entry.isFavorite ? "★" : "☆"}
        </button>
      </div>
      <p className="min-h-12 text-sm leading-6 text-ink/75">{preview}</p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Link to={`/entries/${entry._id}`} className="btn-secondary px-4 py-2 text-sm">
          View details
        </Link>
        <button onClick={() => onDelete(entry._id)} className="text-sm font-bold text-red-600 hover:text-red-700">
          Delete
        </button>
      </div>
    </article>
  );
};

export default MoodCard;
