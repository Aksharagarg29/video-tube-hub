import { useRef, useState } from "react";
import { updateCoverImage } from "../../api/userApi";

export default function CoverEditor({
  coverImage,
  onUpdated,
  onMessage,
}) {
  const inputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleSelect(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setEditing(true);
    onMessage("", "");
  }

  function cancel() {
    setSelectedFile(null);
    setEditing(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!selectedFile) return;

    setLoading(true);
    onMessage("", "");

    try {
      const formData = new FormData();
      formData.append("coverImage", selectedFile);

      const res = await updateCoverImage(formData);

      onUpdated(res.data.data.coverImage);

      cancel();

      onMessage(
        "Cover image updated successfully.",
        ""
      );
    } catch (err) {
      onMessage(
        "",
        err.response?.data?.message ||
          "Could not update cover image."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full h-[220px] rounded-xl overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500">

      {selectedFile ? (
        <img
          className="w-full h-full object-cover"
          src={URL.createObjectURL(selectedFile)}
          alt="Cover preview"
        />
      ) : (
        coverImage && (
          <img
            className="w-full h-full object-cover"
            src={coverImage}
            alt=""
          />
        )
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelect}
      />

      {!editing ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute top-4 right-4 px-3 py-2 rounded-lg bg-black/60 text-white text-sm hover:bg-black/75 transition"
        >
          Edit cover
        </button>
      ) : (
        <div className="absolute top-4 right-4 flex gap-2">

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-primary text-white text-sm"
          >
            {loading ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={cancel}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-black/70 text-white text-sm"
          >
            Cancel
          </button>

        </div>
      )}
    </div>
  );
}