import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", age: "", location: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-container grid min-h-[72vh] place-items-center py-14">
      <form onSubmit={handleSubmit} className="card w-full max-w-xl p-7">
        <h1 className="text-3xl font-black text-ink">Create your mirror</h1>
        <p className="mt-2 text-ink/62">A private place for small truths and useful patterns.</p>

        {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-bold text-ink/72">
            Name
            <input className="form-input mt-2" name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label className="block text-sm font-bold text-ink/72">
            Email
            <input className="form-input mt-2" name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label className="block text-sm font-bold text-ink/72">
            Password
            <input
              className="form-input mt-2"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </label>
          <label className="block text-sm font-bold text-ink/72">
            Age
            <input className="form-input mt-2" name="age" type="number" value={form.age} onChange={handleChange} />
          </label>
          <label className="block text-sm font-bold text-ink/72 md:col-span-2">
            Location
            <input className="form-input mt-2" name="location" value={form.location} onChange={handleChange} />
          </label>
        </div>
        <button className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
        <p className="mt-5 text-center text-sm text-ink/62">
          Already reflecting? <Link to="/login" className="font-bold text-ink">Login</Link>
        </p>
      </form>
    </section>
  );
};

export default Register;
