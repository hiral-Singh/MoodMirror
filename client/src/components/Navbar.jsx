import { Heart, LogOut, Menu } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `rounded-full px-3 py-2 text-sm font-semibold transition ${
      isActive ? "bg-ink text-white" : "text-ink/72 hover:bg-white/70 hover:text-ink"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-mist/80 backdrop-blur">
      <nav className="page-container flex min-h-16 items-center justify-between gap-4">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-black tracking-tight text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white">
            <Heart size={18} />
          </span>
          MoodMirror
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/track" className={linkClass}>Track</NavLink>
              <NavLink to="/entries" className={linkClass}>Entries</NavLink>
              <NavLink to="/analytics" className={linkClass}>Analytics</NavLink>
              <NavLink to="/profile" className={linkClass}>Profile</NavLink>
              <button onClick={handleLogout} className="btn-secondary px-3 py-2" title="Log out">
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <>
              <a href="#about" className="rounded-full px-3 py-2 text-sm font-semibold text-ink/72 hover:bg-white/70">
                About
              </a>
              <Link to="/login" className="btn-secondary px-4 py-2">Login</Link>
              <Link to="/register" className="btn-primary px-4 py-2">Sign Up</Link>
            </>
          )}
        </div>

        <div className="md:hidden">
          <button className="btn-secondary px-3 py-2" title="Menu">
            <Menu size={18} />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
