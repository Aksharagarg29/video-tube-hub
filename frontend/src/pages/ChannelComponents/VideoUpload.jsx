import { useState } from "react";
import api from "../../api/axios";

export default function VideoUpload({
  onMessage,
  onClose,
  onUploaded,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);

  const [isPublished, setIsPublished] = useState(true);

  const [loading, setLoading] = useState(false);

  // --------------------------------
  // SAFE MESSAGE FUNCTION
  // --------------------------------

  function showMessage(
    successMessage = "",
    errorMessage = ""
  ) {
    if (typeof onMessage === "function") {
      onMessage(
        successMessage,
        errorMessage
      );
    }
  }

  // --------------------------------
  // VIDEO CHANGE
  // --------------------------------

  function handleVideoChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setVideoFile(file);

    showMessage("", "");
  }

  // --------------------------------
  // THUMBNAIL CHANGE
  // --------------------------------

  function handleThumbnailChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setThumbnail(file);

    showMessage("", "");
  }

  // --------------------------------
  // SUBMIT
  // --------------------------------

  async function handleSubmit(e) {
    e.preventDefault();

    showMessage("", "");

    // Validation

    if (!title.trim()) {
      showMessage(
        "",
        "Please enter a video title."
      );
      return;
    }

    if (!description.trim()) {
      showMessage(
        "",
        "Please enter a video description."
      );
      return;
    }

    if (!videoFile) {
      showMessage(
        "",
        "Please select a video file."
      );
      return;
    }

    if (!thumbnail) {
      showMessage(
        "",
        "Please select a thumbnail."
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append(
        "title",
        title
      );

      formData.append(
        "description",
        description
      );

      formData.append(
        "videoFile",
        videoFile
      );

      formData.append(
        "thumbnail",
        thumbnail
      );

      // Send publish status
      formData.append(
        "isPublished",
        String(isPublished)
      );

      const res = await api.post(
        "/videos",
        formData
      );

      // Clear form

      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbnail(null);
      setIsPublished(true);

      // Reset file inputs

      document
        .querySelectorAll(
          'input[type="file"]'
        )
        .forEach((input) => {
          input.value = "";
        });

      // Tell parent upload succeeded

      if (typeof onUploaded === "function") {
        await onUploaded(res.data.data);
      }

    } catch (err) {
      console.error(
        "VIDEO UPLOAD ERROR:",
        err
      );

      const message =
        err.response?.data?.message ||
        "Could not upload video. Please try again.";

      showMessage(
        "",
        message
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <div
      className="bg-surface border border-border rounded-xl p-6 mt-6"
      onClick={(e) =>
        e.stopPropagation()
      }
    >

      {/* HEADER */}

      <div className="flex items-center justify-between mb-5">

        <div>
          <h2 className="text-xl font-semibold">
            Upload Video
          </h2>

          <p className="text-muted text-sm mt-1">
            Upload your video and choose whether
            it should be public or private.
          </p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>

      </div>

      {/* FORM */}

      <form onSubmit={handleSubmit}>

        {/* TITLE */}

        <div className="field">
          <label>Title</label>

          <input
            className="input"
            type="text"
            placeholder="Enter video title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />
        </div>

        {/* DESCRIPTION */}

        <div className="field">
          <label>Description</label>

          <textarea
            className="input min-h-[120px]"
            placeholder="Enter video description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
          />
        </div>

        {/* VIDEO */}

        <div className="field">
          <label>Video</label>

          <input
            className="input"
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
          />

          {videoFile && (
            <p className="text-muted text-xs mt-1">
              Selected: {videoFile.name}
            </p>
          )}
        </div>

        {/* THUMBNAIL */}

        <div className="field">
          <label>Thumbnail</label>

          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={
              handleThumbnailChange
            }
          />

          {thumbnail && (
            <p className="text-muted text-xs mt-1">
              Selected: {thumbnail.name}
            </p>
          )}
        </div>

        {/* PUBLISH TOGGLE */}

        <div className="flex items-center justify-between border border-border rounded-lg p-4 mt-5">

          <div>
            <p className="font-semibold text-sm">
              Publish video
            </p>

            <p className="text-muted text-xs mt-1">
              {isPublished
                ? "Anyone can watch this video."
                : "Only you can see this video."
              }
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setIsPublished(
                (prev) => !prev
              )
            }
            className={`relative w-12 h-6 rounded-full transition ${
              isPublished
                ? "bg-primary"
                : "bg-border"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
                isPublished
                  ? "left-7"
                  : "left-1"
              }`}
            />
          </button>

        </div>

        {/* BUTTONS */}

        <div className="flex gap-3 mt-6">

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading
              ? "Uploading..."
              : isPublished
              ? "Publish Video"
              : "Save as Private"}
          </button>

          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  );
}