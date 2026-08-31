import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function loadHistory() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users/history");
      setVideos(res.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load watch history."
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <Layout>
        <p className="text-muted">Loading...</p>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-text font-semibold text-lg mb-2">
            Login required
          </p>
          <p className="text-muted text-sm mb-5">
            Log in to see your watch history.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="btn btn-primary"
          >
            Log in
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Watch history</h1>
        <p className="text-sm text-muted mt-1">Videos you've watched</p>
      </div>

      {loading && <p className="text-muted">Loading history...</p>}

      {!loading && error && <p className="text-danger">{error}</p>}

      {!loading && !error && videos.length === 0 && (
        <div className="text-center py-20 text-muted">
          <p className="text-text font-semibold text-base mb-1.5">
            No watch history yet
          </p>
          <p>Videos you watch will appear here.</p>
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
