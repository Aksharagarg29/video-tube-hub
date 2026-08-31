import { useState } from "react";
import CommentItem from "./CommentItem";
import { getErrorMessage } from "../../utils/getErrorMessage";

export default function CommentSection({ comments, user, createComment, onLikeChanged, onUpdateComment, onDeleteComment }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault(); if (!content.trim() || submitting) return;
    setSubmitting(true); setError("");
    try { await createComment(content.trim()); setContent(""); }
    catch (requestError) { setError(getErrorMessage(requestError, "Please log in to comment.")); }
    finally { setSubmitting(false); }
  };
  return <section className="mt-6"><h2 className="text-base mb-4">{comments.length} Comments</h2>{user && <form className="flex gap-3 mb-6" onSubmit={submit}><input className="input flex-1" placeholder="Add a comment" value={content} onChange={(event) => setContent(event.target.value)} /><button className="btn btn-primary" disabled={submitting}>Comment</button></form>}{error && <p className="text-danger text-sm">{error}</p>}{comments.map((comment) => <CommentItem key={comment._id} comment={comment} canLike={Boolean(user)} currentUserId={user?._id} onLikeChanged={onLikeChanged} onUpdate={onUpdateComment} onDelete={onDeleteComment} onError={setError} />)}</section>;
}
