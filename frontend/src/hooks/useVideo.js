import { useEffect, useState } from "react";
import { getVideo, recordVideoView } from "../api/video.api";

// Promise coalescing makes React StrictMode's development remount share one view request.
const viewRequests = new Map();
const countViewOnce = (videoId) => {
  if (!viewRequests.has(videoId)) viewRequests.set(videoId, recordVideoView(videoId));
  return viewRequests.get(videoId);
};

export function useVideo(videoId) {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getVideo(videoId)
      .then((response) => countViewOnce(videoId).then((viewResponse) => ({ video: response.data.data, views: viewResponse.data.data.views })))
      .then(({ video: loadedVideo, views }) => {
        if (!active) return;
        // Reshape the aggregated ownerDetails into a plain "owner" field
        // that VideoCard / Watch can render consistently.
        setVideo({
          ...loadedVideo,
          views,
          owner: {
            _id: loadedVideo.ownerDetails?._id,
            userName: loadedVideo.ownerDetails?.userName || "Unknown User",
            fullName: loadedVideo.ownerDetails?.fullName || "",
            avatar: loadedVideo.ownerDetails?.avatar || "",
            subscribersCount: loadedVideo.ownerDetails?.subscribersCount || 0,
            isSubscribed: loadedVideo.ownerDetails?.isSubscribed || false,
          },
        });
      })
      .catch(() => { if (active) setError("Could not load this video."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [videoId]);

  return { video, loading, error, setVideo };
}
