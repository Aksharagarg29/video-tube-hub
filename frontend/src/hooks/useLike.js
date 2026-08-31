import { useCallback, useEffect, useState } from "react";
import { getVideoLikeStatus, toggleLike as requestToggleLike } from "../api/like.api";

export function useLike({ entityType, entityId, enabled = true, initialLiked = false, initialLikeCount = 0 }) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLiked(initialLiked);
    setLikeCount(initialLikeCount);
    if (entityType !== "video" || !entityId) return undefined;
    getVideoLikeStatus(entityId)
      .then((response) => {
        if (active) {
          setLiked(response.data.data.liked);
          setLikeCount(response.data.data.likeCount);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [entityId, entityType, initialLiked, initialLikeCount]);

  const toggle = useCallback(async () => {
    if (!enabled || loading) return null;
    setLoading(true);
    try {
      const response = await requestToggleLike(entityType, entityId);
      setLiked(response.data.data.liked);
      setLikeCount(response.data.data.likeCount);
      return response.data.data;
    } finally {
      setLoading(false);
    }
  }, [enabled, entityId, entityType, loading]);

  return { liked, likeCount, loading, toggle, setLiked, setLikeCount };
}
