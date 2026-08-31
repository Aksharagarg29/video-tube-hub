import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";

export default function LikedVideos() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------
  // LOAD LIKED VIDEOS
  // --------------------------------

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    loadLikedVideos();
  }, [user, authLoading]);

  async function loadLikedVideos() {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/likes/videos");

      const likedData = res.data.data || [];

      setVideos(likedData);
    } catch (err) {
      console.error("LIKED VIDEOS ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Could not load liked videos."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------
  // AUTH LOADING
  // --------------------------------

  if (authLoading) {
    return (
      <Layout>
        <p className="text-muted">
          Loading...
        </p>
      </Layout>
    );
  }

  // --------------------------------
  // NOT LOGGED IN
  // --------------------------------

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">

          <p className="text-text font-semibold text-lg mb-2">
            Login required
          </p>

          <p className="text-muted text-sm mb-5">
            Log in to see your liked videos.
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

  // --------------------------------
  // LOADING
  // --------------------------------

  if (loading) {
    return (
      <Layout>
        <p className="text-muted">
          Loading liked videos...
        </p>
      </Layout>
    );
  }

  // --------------------------------
  // ERROR
  // --------------------------------

  if (error) {
    return (
      <Layout>
        <p className="text-danger">
          {error}
        </p>
      </Layout>
    );
  }

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <Layout>
      <div className="mb-6">

        <h1 className="text-xl font-semibold">
          Liked videos
        </h1>

        <p className="text-sm text-muted mt-1">
          Videos you have liked
        </p>

      </div>

      {videos.length === 0 ? (
        <div className="text-center py-20 text-muted">

          <p className="text-text font-semibold text-base mb-1.5">
            No liked videos
          </p>

          <p>
            Videos you like will appear here.
          </p>

        </div>
      ) : (
        <div className="grid gap-x-4 gap-y-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">

          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
            />
          ))}

        </div>
      )}
    </Layout>
  );
}
