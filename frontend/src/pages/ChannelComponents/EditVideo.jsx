import { useState } from "react";
import api from "../../api/axios";

export default function EditVideo({ video, onClose, onUpdated }) {
  const [title, setTitle] = useState(video.title || "");
  const [description, setDescription] = useState(
    video.description || ""
  );
  const [thumbnail, setThumbnail] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("description", description.trim());

      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      const res = await api.patch(
        `/videos/${video._id}`,
        formData
      );

      setSuccess(
        res.data.message || "Video updated successfully."
      );

      // Send updated video back to Channel.jsx
      if (onUpdated) {
        onUpdated(res.data.data);
      }

      // Close after successful update
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 800);
    } catch (err) {
      console.error("UPDATE VIDEO ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Could not update video. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 p-5 rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-text">
          Edit Video
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-text text-xl"
        >
          ×
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg border border-green-500/40 bg-green-500/10 text-green-400">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* TITLE */}

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-text outline-none focus:border-primary"
            placeholder="Enter video title"
          />
        </div>

        {/* DESCRIPTION */}

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-text outline-none focus:border-primary resize-none"
            placeholder="Enter video description"
          />
        </div>

        {/* THUMBNAIL */}

        <div className="flex items-center gap-3">
        <label
            htmlFor="thumbnail"
            className="cursor-pointer px-4 py-2 rounded-lg border border-border bg-surface text-text text-sm font-medium hover:bg-background transition"
        >
            Choose Thumbnail
        </label>

        <span className="text-sm text-muted truncate">
            {thumbnail ? thumbnail.name : "No file chosen"}
        </span>

        <input
            id="thumbnail"
            type="file"
            accept="image/*"
            onChange={(e) =>
            setThumbnail(e.target.files?.[0] || null)
            }
            className="hidden"
        />
        </div>

        <p className="text-xs text-muted mt-2">
        Leave empty if you don't want to change the thumbnail.
        </p>

        {/* CURRENT THUMBNAIL */}

        {video.thumbnail && (
          <div>
            <p className="text-sm text-muted mb-2">
              Current thumbnail
            </p>

            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full max-w-md aspect-video object-cover rounded-lg"
            />
          </div>
        )}

        {/* BUTTONS */}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Video"}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg border border-border text-text hover:bg-surface disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}