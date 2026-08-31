import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      setVideos([]);
      setLoading(false);
      return;
    }
    loadResults(query);
  }, [query]);

  async function loadResults(q) {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/videos", { params: { query: q } });
      const docs = res.data.data.docs || [];

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
      setError(
        err.response?.data?.message ||
          "Could not run this search. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">
          {query ? `Results for "${query}"` : "Search"}
        </h1>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <p className="text-muted">Searching...</p>
        </div>
      )}

      {!loading && error && (
        <p className="text-danger">{error}</p>
      )}

      {!loading && !error && !query.trim() && (
        <div className="text-center py-20 text-muted">
          <p>Type something in the search bar to find videos.</p>
        </div>
      )}

      {!loading && !error && query.trim() && videos.length === 0 && (
        <div className="text-center py-20 text-muted">
          <p className="text-text font-semibold text-base mb-1.5">
            No results
          </p>
          <p>Try a different search term.</p>
        </div>
      )}

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
