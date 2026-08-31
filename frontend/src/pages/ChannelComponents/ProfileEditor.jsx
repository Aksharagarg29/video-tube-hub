import { useEffect, useState } from "react";

import api from "../../api/axios";

export default function ProfileEditor({
  user,
  refreshUser,
  onSuccess,
  onCancel,
}) {
  const [fullName, setFullName] = useState(
    user?.fullName || ""
  );

  const [userName, setUserName] = useState(
    user?.userName || ""
  );

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // --------------------------------
  // UPDATE FORM WHEN USER CHANGES
  // --------------------------------

  useEffect(() => {
    setFullName(user?.fullName || "");
    setUserName(user?.userName || "");
    setError("");
  }, [user]);

  // --------------------------------
  // SUBMIT
  // --------------------------------

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!fullName.trim()) {
      setError("Full name cannot be empty.");
      return;
    }

    if (!userName.trim()) {
        setError("Username cannot be empty.");
        return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;

    if (!usernameRegex.test(userName.trim())) {
        setError(
            "Username can only contain letters, numbers, underscores and hyphens."
        );
        return;
    }

    setLoading(true);

    try {
      await api.patch(
        "/users/update-details",
        {
          fullName: fullName.trim(),
          userName: userName.trim(),
        }
      );

      // Refresh the shared auth/user state (if the parent gave us a way to),
      // then tell the parent we're done — exactly once, with the new username.
      await refreshUser?.();

      onSuccess?.(userName.trim());

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not update profile."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border rounded-xl p-5">

      <h3 className="font-semibold text-base mb-4">
        Edit profile
      </h3>

      {/* ERROR */}

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* FULL NAME */}

        <div className="field">

          <label>
            Full name
          </label>

          <input
            className="input"
            type="text"
            value={fullName}
            onChange={(e) =>
              setFullName(e.target.value)
            }
            placeholder="Enter your full name"
          />

        </div>

        {/* USERNAME */}

        <div className="field mt-4">

          <label>
            Username
          </label>

          <input
            className="input"
            type="text"
            value={userName}
            onChange={(e) =>
              setUserName(e.target.value)
            }
            placeholder="Enter your username"
          />

        </div>

        {/* BUTTONS */}

        <div className="flex gap-3 mt-5">

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading
              ? "Saving..."
              : "Save changes"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn"
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  );
}
