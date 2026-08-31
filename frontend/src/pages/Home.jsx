import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/videos");

      // Backend returns paginated data:
      // { docs: [...], totalDocs, ... }
      const docs = res.data.data.docs || [];

      // Reshape video owner data for VideoCard
      const videosWithOwner = docs.map((video) => ({
        ...video,
        owner: {
          userName: video.ownerDetails?.userName || "Unknown User",
          avatar:
            video.ownerDetails?.avatar?.url ||
            video.ownerDetails?.avatar ||
            "",
        },
      }));

      setVideos(videosWithOwner);
    } catch (err) {
      console.error("Failed to load videos:", err);

      if (err.response?.status === 401) {
        setError("Log in to explore videos and discover amazing content.");
      } else {
        setError("Something went wrong. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <p className="text-muted">Loading videos...</p>
        </div>
      )}

      {/* Error / logged-out state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4">
          <div className="text-5xl mb-4">🎬</div>

          <h2 className="text-text font-semibold text-xl mb-2">
            Discover your next favourite video
          </h2>

          <p className="text-muted max-w-md">
            {error}
          </p>
        </div>
      )}

      {/* No videos state */}
      {!loading && !error && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="text-5xl mb-4">🎥</div>

          <p className="text-text font-semibold text-base mb-1.5">
            No videos available
          </p>

          <p className="text-muted">
            There are no videos here right now. Please check back later.
          </p>
        </div>
      )}

      {/* Videos */}
      {!loading && !error && videos.length > 0 && (
        <div className="grid gap-x-4 gap-y-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </Layout>
  );
}