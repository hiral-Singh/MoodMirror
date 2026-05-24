import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
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
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-container grid min-h-[72vh] place-items-center py-14">
      <form onSubmit={handleSubmit} className="card w-full max-w-md p-7">
        <h1 className="text-3xl font-black text-ink">Welcome back</h1>
        <p className="mt-2 text-ink/62">Pick up where your last reflection left off.</p>

        {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

        <label className="mt-6 block text-sm font-bold text-ink/72">
          Email
          <input className="form-input mt-2" name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label className="mt-4 block text-sm font-bold text-ink/72">
          Password
          <input
            className="form-input mt-2"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        <button className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="mt-5 text-center text-sm text-ink/62">
          New here? <Link to="/register" className="font-bold text-ink">Create an account</Link>
        </p>
      </form>
    </section>
  );
};

export default Login;
