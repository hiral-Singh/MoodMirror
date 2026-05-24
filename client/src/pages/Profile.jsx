import { Camera } from "lucide-react";
import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    age: user?.age || "",
    location: user?.location || "",
    profilePic: user?.profilePic || ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const { data } = await api.put("/profile", form);
      updateUser(data.user);
      setMessage("Profile updated");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-container py-10">
      <h1 className="text-4xl font-black text-ink">Profile</h1>
      <p className="mt-3 text-ink/65">Keep your personal details simple and current.</p>

      <form onSubmit={handleSubmit} className="card mt-8 grid gap-7 p-7 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-2xl bg-mist p-6 text-center">
          <div className="mx-auto grid h-32 w-32 place-items-center overflow-hidden rounded-full bg-white shadow-soft">
            {form.profilePic ? (
              <img src={form.profilePic} alt={form.name} className="h-full w-full object-cover" />
            ) : (
              <Camera size={34} className="text-ink/45" />
            )}
          </div>
          <p className="mt-4 font-black">{user?.name}</p>
          <p className="text-sm text-ink/55">{user?.email}</p>
        </div>

        <div>
          {message && <p className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</p>}
          {error && <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold text-ink/72">
              Name
              <input className="form-input mt-2" name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label className="block text-sm font-bold text-ink/72">
              Age
              <input className="form-input mt-2" name="age" type="number" value={form.age} onChange={handleChange} />
            </label>
            <label className="block text-sm font-bold text-ink/72 md:col-span-2">
              Location
              <input className="form-input mt-2" name="location" value={form.location} onChange={handleChange} />
            </label>
            <label className="block text-sm font-bold text-ink/72 md:col-span-2">
              Profile picture URL
              <input className="form-input mt-2" name="profilePic" value={form.profilePic} onChange={handleChange} />
            </label>
          </div>
          <button className="btn-primary mt-6" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Profile;
