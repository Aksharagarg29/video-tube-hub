import { useCallback, useEffect, useState } from "react";
import { addComment, deleteComment, getComments, updateComment } from "../api/comment.api";

export function useComments(videoId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const response = await getComments(videoId);
      setComments(response.data.data.docs || []);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => { loadComments().catch(() => {}); }, [loadComments]);

  const createComment = useCallback(async (content) => {
    const response = await addComment(videoId, content);
    await loadComments();
    return response.data.data;
  }, [loadComments, videoId]);

  const updateCommentLike = useCallback((commentId, likeData) => {
    setComments((current) => current.map((comment) => comment._id === commentId
      ? { ...comment, isLiked: likeData.liked, likeCount: likeData.likeCount }
      : comment));
  }, []);

  const editComment = useCallback(async (commentId, content) => {
    const response = await updateComment(commentId, content);
    const updated = response.data.data;
    setComments((current) => current.map((comment) => comment._id === commentId
      ? { ...comment, content: updated.content }
      : comment));
    return updated;
  }, []);

  const removeComment = useCallback(async (commentId) => {
    await deleteComment(commentId);
    setComments((current) => current.filter((comment) => comment._id !== commentId));
  }, []);

  return { comments, loading, createComment, updateCommentLike, editComment, removeComment };
}
