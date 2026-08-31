import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deletePlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../api/playlist.api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function PlaylistDetail() {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadPlaylist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  async function loadPlaylist() {
    setLoading(true);
    setError("");
    try {
      const res = await getPlaylistById(playlistId);
      setPlaylist(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load this playlist."));
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveVideo(videoId) {
    setActionError("");
    try {
      await removeVideoFromPlaylist(playlistId, videoId);
      setPlaylist((prev) => ({
        ...prev,
        video: prev.video.filter((v) => v._id !== videoId),
      }));
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not remove this video."));
    }
  }

  function startEditing() {
    setEditName(playlist.name);
    setEditDescription(playlist.description);
    setEditError("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditError("");
  }

  async function handleUpdatePlaylist(e) {
    e.preventDefault();
    setEditError("");

    if (!editName.trim() || !editDescription.trim()) {
      setEditError("Name and description are required.");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await updatePlaylist(playlistId, editName.trim(), editDescription.trim());
      setPlaylist((prev) => ({
        ...prev,
        name: res.data.data.name,
        description: res.data.data.description,
      }));
      setEditing(false);
    } catch (err) {
      setEditError(getErrorMessage(err, "Could not update playlist."));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeletePlaylist() {
    if (!window.confirm("Delete this playlist? This cannot be undone.")) return;
    try {
      await deletePlaylist(playlistId);
      navigate("/playlists");
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not delete this playlist."));
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-muted">Loading playlist...</p>
      </Layout>
    );
  }

  if (error || !playlist) {
    return (
      <Layout>
        <p className="text-danger">{error || "Playlist not found."}</p>
      </Layout>
    );
  }

  const isOwner = user?._id === (playlist.owner?._id || playlist.owner);
  const videos = playlist.video || [];

  return (
    <Layout>
      <div className="flex items-start justify-between gap-4 mb-6">
        {editing ? (
          <form onSubmit={handleUpdatePlaylist} className="flex-1 p-4 rounded-xl border border-border bg-surface">
            {editError && (
              <p className="bg-danger/10 border border-danger text-danger px-3 py-2.5 rounded-lg text-[13px] mb-3">
                {editError}
              </p>
            )}
            <div className="field">
              <label>Name</label>
              <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="input min-h-[80px]" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingEdit} className="btn btn-primary">
                {savingEdit ? "Saving..." : "Save changes"}
              </button>
              <button type="button" onClick={cancelEditing} className="btn">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h1 className="text-xl font-semibold">{playlist.name}</h1>
            <p className="text-sm text-muted mt-1">{playlist.description}</p>
            <p className="text-xs text-muted mt-2">
              {videos.length} video{videos.length === 1 ? "" : "s"}
            </p>
          </div>
        )}

        {isOwner && !editing && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={startEditing}
              className="px-3 py-1.5 rounded-lg border border-border text-text text-xs font-medium hover:bg-surface transition"
            >
              Edit playlist
            </button>
            <button
              type="button"
              onClick={handleDeletePlaylist}
              className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-xs font-medium hover:bg-red-500/10 transition"
            >
              Delete playlist
            </button>
          </div>
        )}
      </div>

      {actionError && <p className="text-danger mb-4">{actionError}</p>}

      {videos.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="text-text font-semibold text-base mb-1.5">
            No videos in this playlist
          </p>
          <p>Add videos to this playlist from the watch page.</p>
        </div>
      ) : (
        <div className="grid gap-x-4 gap-y-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {videos.map((video) => (
            <div key={video._id}>
              <VideoCard video={video} />
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemoveVideo(video._id)}
                  className="mt-2 px-3 py-1.5 rounded-lg border border-border text-text text-xs font-medium hover:bg-surface transition"
                >
                  Remove from playlist
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
