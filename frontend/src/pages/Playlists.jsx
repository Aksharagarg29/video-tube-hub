import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPlaylist, getUserPlaylists } from "../api/playlist.api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function Playlists() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function loadPlaylists() {
    setLoading(true);
    setError("");
    try {
      const res = await getUserPlaylists(user._id);
      setPlaylists(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load playlists."));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !description.trim()) {
      setFormError("Name and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createPlaylist(name.trim(), description.trim());
      setName("");
      setDescription("");
      setCreating(false);
      await loadPlaylists();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not create playlist."));
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <Layout>
        <p className="text-muted">Loading...</p>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-text font-semibold text-lg mb-2">
            Login required
          </p>
          <p className="text-muted text-sm mb-5">
            Log in to see and create your playlists.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="btn btn-primary"
          >
            Log in
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Playlists</h1>
          <p className="text-sm text-muted mt-1">
            Collections of videos you've saved
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setCreating((prev) => !prev)}
        >
          {creating ? "Cancel" : "+ New playlist"}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="mb-8 p-5 rounded-xl border border-border bg-surface"
        >
          {formError && (
            <p className="bg-danger/10 border border-danger text-danger px-3 py-2.5 rounded-lg text-[13px] mb-4">
              {formError}
            </p>
          )}

          <div className="field">
            <label>Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Watch later"
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              className="input min-h-[90px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this playlist for?"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? "Creating..." : "Create playlist"}
          </button>
        </form>
      )}

      {loading && <p className="text-muted">Loading playlists...</p>}

      {!loading && error && <p className="text-danger">{error}</p>}

      {!loading && !error && playlists.length === 0 && (
        <div className="text-center py-20 text-muted">
          <p className="text-text font-semibold text-base mb-1.5">
            No playlists yet
          </p>
          <p>Create one to start saving videos.</p>
        </div>
      )}

      {!loading && !error && playlists.length > 0 && (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {playlists.map((playlist) => (
            <Link
              key={playlist._id}
              to={`/playlists/${playlist._id}`}
              className="block p-4 rounded-lg border border-border bg-surface hover:bg-bg transition"
            >
              <p className="font-semibold text-text truncate">
                {playlist.name}
              </p>
              <p className="text-sm text-muted mt-1 line-clamp-2">
                {playlist.description}
              </p>
              <p className="text-xs text-muted mt-3">
                {playlist.video?.length || 0} video
                {playlist.video?.length === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
