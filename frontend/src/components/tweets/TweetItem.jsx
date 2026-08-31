import { useState } from "react";
import LikeButton from "../LikeButton";
import { useLike } from "../../hooks/useLike";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function TweetItem({ tweet, canLike, isOwner, onUpdate, onDelete, onError }) {
  const { liked, likeCount, loading, toggle } = useLike({ entityType: "tweet", entityId: tweet._id, enabled: canLike, initialLiked: tweet.isLiked, initialLikeCount: tweet.likeCount });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tweet.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async () => {
    try { await toggle(); }
    catch (error) { onError(getErrorMessage(error, "Please log in to like posts.")); }
  };

  const startEditing = () => { setDraft(tweet.content); setEditing(true); };
  const cancelEditing = () => { setEditing(false); setDraft(tweet.content); };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!draft.trim() || saving) return;
    setSaving(true);
    try { await onUpdate(tweet._id, draft.trim()); setEditing(false); }
    catch (error) { onError(getErrorMessage(error, "Could not update post.")); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    try { await onDelete(tweet._id); }
    catch (error) { onError(getErrorMessage(error, "Could not delete post.")); setDeleting(false); }
  };

  return (
    <div className="flex gap-3 p-4 rounded-lg border border-border bg-surface">
      <img
        className="w-9 h-9 rounded-full object-cover shrink-0"
        src={tweet.owner?.avatar || "https://placehold.co/36x36"}
        alt=""
      />
      <div className="flex-1 min-w-0">
        <p className="m-0 mb-1 text-[13px] font-semibold">{tweet.owner?.userName}</p>

        {editing ? (
          <form onSubmit={saveEdit} className="flex gap-2 items-start">
            <input className="input flex-1 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)} autoFocus />
            <button type="submit" className="btn btn-primary text-xs px-3 py-1.5" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            <button type="button" className="btn text-xs px-3 py-1.5" onClick={cancelEditing}>Cancel</button>
          </form>
        ) : (
          <p className="m-0 text-sm text-muted whitespace-pre-wrap">{tweet.content}</p>
        )}

        <div className="flex items-center gap-3 mt-2">
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
    </div>
  );
}
