import { useState } from "react";
import LikeButton from "../LikeButton";
import { useLike } from "../../hooks/useLike";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function CommentItem({ comment, canLike, currentUserId, onLikeChanged, onUpdate, onDelete, onError }) {
  const { liked, likeCount, loading, toggle } = useLike({ entityType: "comment", entityId: comment._id, enabled: canLike, initialLiked: comment.isLiked, initialLikeCount: comment.likeCount });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = Boolean(currentUserId) && currentUserId === comment.owner?._id;

  const handleLike = async () => {
    try { const data = await toggle(); if (data) onLikeChanged(comment._id, data); }
    catch (error) { onError(getErrorMessage(error, "Please log in to like comments.")); }
  };

  const startEditing = () => { setDraft(comment.content); setEditing(true); };
  const cancelEditing = () => { setEditing(false); setDraft(comment.content); };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!draft.trim() || saving) return;
    setSaving(true);
    try { await onUpdate(comment._id, draft.trim()); setEditing(false); }
    catch (error) { onError(getErrorMessage(error, "Could not update comment.")); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm("Delete this comment?")) return;
    setDeleting(true);
    try { await onDelete(comment._id); }
    catch (error) { onError(getErrorMessage(error, "Could not delete comment.")); setDeleting(false); }
  };

  return <div className="flex gap-3 mb-4">
    <img className="w-9 h-9 rounded-full object-cover shrink-0" src={comment.owner?.avatar || "https://placehold.co/36x36"} alt="" />
    <div className="flex-1 min-w-0">
      <p className="m-0 mb-0.5 text-[13px] font-semibold">{comment.owner?.userName}</p>

      {editing ? (
        <form onSubmit={saveEdit} className="flex gap-2 items-start">
          <input className="input flex-1 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)} autoFocus />
          <button type="submit" className="btn btn-primary text-xs px-3 py-1.5" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" className="btn text-xs px-3 py-1.5" onClick={cancelEditing}>Cancel</button>
        </form>
      ) : (
        <p className="m-0 text-sm text-muted">{comment.content}</p>
      )}

      <div className="flex items-center gap-3 mt-1">
        <LikeButton liked={liked} likeCount={likeCount} loading={loading} onToggle={handleLike} label={false} className="!border-0 !px-0 !py-1 text-xs" />
        {isOwner && !editing && (
          <>
            <button type="button" onClick={startEditing} className="text-xs text-muted hover:text-text">Edit</button>
            <button type="button" onClick={handleDelete} disabled={deleting} className="text-xs text-muted hover:text-danger">
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </>
        )}
      </div>
    </div>
  </div>;
}
