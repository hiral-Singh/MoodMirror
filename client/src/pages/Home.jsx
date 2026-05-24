import { ArrowRight, Lock, LineChart, PenLine, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "Ready to reflect?",
    text: "Capture one honest moment each day and leave the emotional bookkeeping to MoodMirror.",
    icon: PenLine
  },
  {
    title: "Track your emotional patterns",
    text: "See what keeps showing up, from small bright spots to recurring stress signals.",
    icon: Sparkles
  },
  {
    title: "Understand your week",
    text: "Simple charts turn daily check-ins into a calmer view of your emotional rhythm.",
    icon: LineChart
  },
  {
    title: "Private and secure journaling",
    text: "Your account uses password hashing and HTTP-only cookies for safer sessions.",
    icon: Lock
  }
];

const Home = () => (
  <div>
    <section className="page-container grid min-h-[72vh] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <p className="mb-4 inline-flex rounded-full bg-white/75 px-4 py-2 text-sm font-bold text-ink/70 shadow-soft">
          A calmer way to notice yourself
        </p>
        <h1 className="text-6xl font-black leading-none text-ink sm:text-7xl">Hello.</h1>
        <p className="mt-6 max-w-xl text-xl leading-8 text-ink/70">
          Your feelings called. They want fewer dramatic meetings and better notes.
          <br />
          MoodMirror helps you spot patterns before your week starts improvising.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="btn-primary">
            Get Started <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary">Login</Link>
        </div>
      </div>

      <div className="card p-6">
        <div className="rounded-[1rem] bg-mist p-5">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink/45">Today</p>
          <div className="mt-6 grid grid-cols-5 gap-2 text-center text-3xl">
            <span className="rounded-2xl bg-white p-3">😄</span>
            <span className="rounded-2xl bg-white p-3">🙂</span>
            <span className="rounded-2xl bg-white p-3">😐</span>
            <span className="rounded-2xl bg-white p-3">😔</span>
            <span className="rounded-2xl bg-white p-3">😣</span>
          </div>
          <div className="mt-6 rounded-2xl bg-white p-5">
            <p className="text-sm font-semibold text-ink/58">Reflection</p>
            <p className="mt-2 leading-7 text-ink/80">
              I felt stretched thin this morning, but the walk after lunch made the day softer.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section id="about" className="bg-white/52 py-16">
      <div className="page-container grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <article key={section.title} className="card p-6">
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-full bg-sage/18 text-ink">
                <Icon size={21} />
              </div>
              <h2 className="text-xl font-black text-ink">{section.title}</h2>
              <p className="mt-3 leading-7 text-ink/68">{section.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  </div>
);

export default Home;
