import { useRef, useState } from "react";
import { updateAvatar } from "../../api/userApi";

export default function AvatarEditor({
  avatar,
  userName,
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
      formData.append("avatar", selectedFile);

      const res = await updateAvatar(formData);

      onUpdated(res.data.data.avatar);

      cancel();

      onMessage(
        "Profile photo updated successfully.",
        ""
      );
    } catch (err) {
      onMessage(
        "",
        err.response?.data?.message ||
          "Could not update profile photo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative shrink-0">

      <img
        className="w-28 h-28 rounded-full object-cover border-4 border-bg bg-surface shadow-lg"
        src={
          selectedFile
            ? URL.createObjectURL(selectedFile)
            : avatar || "https://placehold.co/112x112"
        }
        alt={userName}
        referrerPolicy="no-referrer"
      />

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
          className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-surface border border-border shadow flex items-center justify-center text-sm hover:bg-bg transition"
          title="Change profile photo"
        >
          ✎
        </button>
      ) : (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex gap-1 whitespace-nowrap">

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs"
          >
            {loading ? "..." : "Save"}
          </button>

          <button
            type="button"
            onClick={cancel}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs"
          >
            Cancel
          </button>

        </div>
      )}
    </div>
  );
}