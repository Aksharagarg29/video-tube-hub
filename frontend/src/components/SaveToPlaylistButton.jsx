import { useEffect, useRef, useState } from "react";
import {
  addVideoToPlaylist,
  createPlaylist,
  getUserPlaylists,
  removeVideoFromPlaylist,
} from "../api/playlist.api";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function SaveToPlaylistButton({ videoId }) {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const menuRef = useRef(null);

  // --------------------------------
  // CLOSE ON OUTSIDE CLICK
  // --------------------------------

  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  // --------------------------------
  // OPEN / LOAD PLAYLISTS
  // --------------------------------

  async function handleOpen() {
    if (!user) {
      window.alert("Please log in to save videos to a playlist.");
      return;
    }

    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    setCreating(false);
    setLoading(true);
    setError("");

    try {
      const res = await getUserPlaylists(user._id);
      setPlaylists(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your playlists."));
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------
  // ADD / REMOVE FROM A PLAYLIST
  // --------------------------------

  async function toggleVideoInPlaylist(playlist) {
    const alreadyIn = playlist.video?.includes(videoId);
    setBusyId(playlist._id);

    try {
      if (alreadyIn) {
        await removeVideoFromPlaylist(playlist._id, videoId);
      } else {
        await addVideoToPlaylist(playlist._id, videoId);
      }

      setPlaylists((prev) =>
        prev.map((p) =>
          p._id === playlist._id
            ? {
                ...p,
                video: alreadyIn
                  ? (p.video || []).filter((id) => id !== videoId)
                  : [...(p.video || []), videoId],
              }
            : p
        )
      );
    } catch (err) {
      window.alert(getErrorMessage(err, "Could not update that playlist."));
    } finally {
      setBusyId(null);
    }
  }

  // --------------------------------
  // CREATE A NEW PLAYLIST (AND ADD THIS VIDEO)
  // --------------------------------

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !description.trim()) {
      setFormError("Name and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createPlaylist(name.trim(), description.trim());
      const newPlaylist = res.data.data;

      await addVideoToPlaylist(newPlaylist._id, videoId);

      setPlaylists((prev) => [{ ...newPlaylist, video: [videoId] }, ...prev]);
      setName("");
      setDescription("");
      setCreating(false);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not create playlist."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button type="button" onClick={handleOpen} className="btn">
        + Save
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-surface shadow-xl z-20 p-3">
          <p className="text-sm font-semibold mb-2">Save to playlist</p>

          {loading && <p className="text-xs text-muted">Loading playlists...</p>}
          {!loading && error && <p className="text-xs text-danger">{error}</p>}

          {!loading && !error && (
            <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
              {playlists.length === 0 && !creating && (
                <p className="text-xs text-muted mb-1">
                  You don't have any playlists yet.
                </p>
              )}

              {playlists.map((playlist) => {
                const checked = Boolean(playlist.video?.includes(videoId));
                return (
                  <label
                    key={playlist._id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-bg cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={busyId === playlist._id}
                      onChange={() => toggleVideoInPlaylist(playlist)}
                    />
                    <span className="truncate">{playlist.name}</span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="border-t border-border mt-2 pt-2">
            {!creating ? (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="text-xs text-primary font-semibold"
              >
                + New playlist
              </button>
            ) : (
              <form onSubmit={handleCreate} className="flex flex-col gap-2">
                {formError && <p className="text-xs text-danger">{formError}</p>}

                <input
                  className="input text-xs py-1.5"
                  placeholder="Playlist name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <textarea
                  className="input text-xs py-1.5 min-h-[50px]"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary text-xs px-3 py-1.5 disabled:opacity-60"
                  >
                    {submitting ? "Creating..." : "Create & add"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="btn text-xs px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
