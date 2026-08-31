import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import CommentSection from "../components/comments/CommentSection";
import Layout from "../components/Layout";
import LikeButton from "../components/LikeButton";
import SaveToPlaylistButton from "../components/SaveToPlaylistButton";
import SubscribeButton from "../components/SubscribeButton";
import { toggleSubscription } from "../api/subscription.api";
import { useAuth } from "../context/AuthContext";
import { useComments } from "../hooks/useComments";
import { useLike } from "../hooks/useLike";
import { useVideo } from "../hooks/useVideo";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function Watch() {
  const { videoId } = useParams();
  const { user } = useAuth();
  const { video, loading, error, setVideo } = useVideo(videoId);
  const { comments, createComment, updateCommentLike, editComment, removeComment } = useComments(videoId);
  const videoLike = useLike({ entityType: "video", entityId: videoId, enabled: Boolean(user) });
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  const toggleVideoLike = async () => {
    try { await videoLike.toggle(); }
    catch (requestError) { window.alert(getErrorMessage(requestError, "Please log in to like videos.")); }
  };

  const toggleOwnerSubscription = async () => {
    if (!video?.owner?._id || subscribeLoading) return;
    setSubscribeLoading(true);
    try {
      const response = await toggleSubscription(video.owner._id);
      const subscribed = response.data.data.subscribed;
      setVideo((current) => current && {
        ...current,
        owner: {
          ...current.owner,
          isSubscribed: subscribed,
          subscribersCount: Math.max(0, (current.owner.subscribersCount || 0) + (subscribed ? 1 : -1)),
        },
      });
    } catch (requestError) {
      window.alert(getErrorMessage(requestError, "Please log in to subscribe."));
    } finally {
      setSubscribeLoading(false);
    }
  };

  if (loading) return <Layout showSidebar={false}><p className="text-muted">Loading video...</p></Layout>;
  if (error || !video) return <Layout showSidebar={false}><p className="text-danger">{error || "Video not found."}</p></Layout>;

  const isOwnVideo = user && video.owner?._id && user._id === video.owner._id;

  return <Layout showSidebar={false}><div className="flex gap-6 max-w-[900px] mx-auto"><div className="flex-1 min-w-0">
    <video className="w-full aspect-video bg-black rounded-lg" src={video.videoFile} controls autoPlay />
    <h1 className="text-xl mt-4 mb-2">{video.title}</h1>

    {/* OWNER ROW */}
    {video.owner?.userName && (
      <div className="flex items-center justify-between gap-4 py-3 border-y border-border mb-4">
        <Link to={`/channel/${video.owner.userName}`} className="flex items-center gap-3 min-w-0">
          <img
            className="w-11 h-11 rounded-full object-cover shrink-0"
            src={video.owner.avatar || "https://placehold.co/44x44"}
            alt={video.owner.userName}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{video.owner.fullName || video.owner.userName}</p>
            <p className="text-xs text-muted truncate">
              @{video.owner.userName} · {video.owner.subscribersCount} subscribers
            </p>
          </div>
        </Link>

        {!isOwnVideo && (
          <SubscribeButton
            subscribed={video.owner.isSubscribed}
            loading={subscribeLoading}
            onToggle={toggleOwnerSubscription}
          />
        )}
      </div>
    )}

    <div className="flex items-center gap-4 mb-4">
      <span className="text-muted text-sm">{video.views} views</span>
      <LikeButton liked={videoLike.liked} likeCount={videoLike.likeCount} loading={videoLike.loading} onToggle={toggleVideoLike} />
      <SaveToPlaylistButton videoId={videoId} />
    </div>
    {video.description && <p className="bg-surface rounded-lg px-4 py-3 text-sm text-muted whitespace-pre-wrap">{video.description}</p>}
    <CommentSection comments={comments} user={user} createComment={createComment} onLikeChanged={updateCommentLike} onUpdateComment={editComment} onDeleteComment={removeComment} />
  </div></div></Layout>;
}
