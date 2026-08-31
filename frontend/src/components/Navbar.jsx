import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();

  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  // --------------------------------
  // SEARCH
  // --------------------------------

  function handleSearchSubmit(e) {
    e.preventDefault();

    if (search.trim()) {
      navigate(
        `/search?q=${encodeURIComponent(search.trim())}`
      );
    }
  }

  // --------------------------------
  // LOGOUT
  // --------------------------------

  async function handleLogout() {
    await logout();

    navigate("/login");
  }

  // --------------------------------
  // UPLOAD VIDEO
  // --------------------------------

  function handleUploadVideo() {
    if (!user?.userName) return;

    navigate(`/channel/${user.userName}`, {
      state: {
        openUpload: true,
      },
    });
  }

  return (
    <header className="h-16 flex items-center gap-6 px-6 border-b border-border sticky top-0 bg-bg z-10">
      {/* LOGO */}

      <Link
        to="/"
        className="flex items-center gap-2 font-bold text-lg shrink-0"
      >
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] text-white bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500">
          VT
        </span>

        <span>VIDEO-TUBE-HUB</span>
      </Link>

      {/* SEARCH */}

      <form
        className="flex-1 max-w-[600px]"
        onSubmit={handleSearchSubmit}
      >
        <input
          className="input"
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {/* USER ACTIONS */}

      <div className="flex items-center gap-3 ml-auto shrink-0">
        {user ? (
          <>
            {/* UPLOAD VIDEO */}

            <button
              type="button"
              onClick={handleUploadVideo}
              className="btn btn-primary"
            >
              + Upload Video
            </button>

            {/* NOTIFICATIONS */}

            <NotificationBell />

            {/* PROFILE AVATAR */}

            <Link to={`/channel/${user.userName}`}>
              <img
                className="w-9 h-9 rounded-full object-cover block"
                src={
                  user.avatar ||
                  "https://placehold.co/40x40"
                }
                alt={user.userName}
              />
            </Link>

            {/* LOGOUT */}

            <button
              className="btn"
              onClick={handleLogout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn">
              Log in
            </Link>

            <Link
              to="/signup"
              className="btn btn-primary"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
