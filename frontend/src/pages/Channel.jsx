import {useEffect,useRef,useState,} from "react";
import {Link,useLocation,useNavigate,useParams} from "react-router-dom";
import api from "../api/axios";
import { toggleSubscription } from "../api/subscription.api";
import { getUserPlaylists } from "../api/playlist.api";
import { getChannelStats } from "../api/dashboard.api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";
import TweetSection from "../components/tweets/TweetSection";

import ChannelHeader from "./ChannelComponents/ChannelHeader";
import AccountSettings from "./ChannelComponents/AccountSettings";
import VideoUpload from "./ChannelComponents/VideoUpload";
import EditVideo from "./ChannelComponents/EditVideo";

export default function Channel() {
  const { userName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingVideo, setEditingVideo] = useState(null);
  const [deletingVideo, setDeletingVideo] = useState(null);
  const messageRef = useRef(null);

  // --------------------------------
  // LOAD CHANNEL
  // --------------------------------

  useEffect(() => {
    loadChannel();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  async function loadChannel() {
    if (!userName) return;

    setLoading(true);
    setError("");

    try {
        const res = await api.get(
        `/users/c/${userName}`
        );

        const channelData = res.data.data;

        setChannel(channelData);

        await Promise.all([
          loadVideos(channelData._id),
          loadPlaylists(channelData._id),
        ]);
    } catch (err) {
        console.error(
        "CHANNEL ERROR:",
        err
        );

        setError(
        "Could not load this channel. (You may need to log in first.)"
        );
    } finally {
        setLoading(false);
    }
    }

  // --------------------------------
  // LOAD VIDEOS
  // --------------------------------

  async function loadVideos(channelId) {
    try {
      const videosRes = await api.get(
        `/videos?userId=${channelId}`
      );

      setVideos(
        videosRes.data.data?.docs || []
      );
    } catch (err) {
      console.error(
        "VIDEOS ERROR:",
        err
      );

      setVideos([]);
    }
  }

  // --------------------------------
  // LOAD PLAYLISTS
  // --------------------------------

  async function loadPlaylists(channelId) {
    try {
      const playlistsRes = await getUserPlaylists(channelId);

      setPlaylists(playlistsRes.data.data || []);
    } catch (err) {
      // Playlist listing requires being logged in; a logged-out visitor
      // simply sees no playlists section instead of an error.
      console.error(
        "PLAYLISTS ERROR:",
        err
      );

      setPlaylists([]);
    }
  }

  // --------------------------------
  // LOAD CHANNEL STATS (OWN CHANNEL ONLY)
  // --------------------------------

  useEffect(() => {
    if (!channel || !user || user.userName !== channel.userName) {
      setStats(null);
      return;
    }

    let active = true;
    getChannelStats()
      .then((res) => { if (active) setStats(res.data.data); })
      .catch((err) => console.error("STATS ERROR:", err));

    return () => { active = false; };
  }, [channel, user]);

  // --------------------------------
  // OPEN UPLOAD FROM NAVBAR
  // --------------------------------

  useEffect(() => {
    if (location.state?.openUpload) {
      setActionMessage("");
      setActionError("");

      setActiveSection("upload");

      // Clear navigation state after opening upload.
      // This prevents the upload form from reopening
      // unexpectedly on future navigation.
      navigate(
        location.pathname,
        {
          replace: true,
          state: null,
        }
      );
    }
  }, [
    location.state,
    location.pathname,
    navigate,
  ]);

  // --------------------------------
  // DELETE VIDEO
  // --------------------------------

  async function handleDeleteVideo() {
    if (!deletingVideo) return;

    try {
      setActionMessage("");
      setActionError("");

      await api.delete(
        `/videos/${deletingVideo._id}`
      );

      setVideos((currentVideos) =>
        currentVideos.filter(
          (video) =>
            video._id !== deletingVideo._id
        )
      );

      setDeletingVideo(null);

      setActionMessage(
        "Video deleted successfully."
      );
    } catch (err) {
      console.error(
        "DELETE VIDEO ERROR:",
        err
      );

      setActionError(
        err.response?.data?.message ||
          "Could not delete video. Please try again."
      );

      setActionMessage("");
    }
  }

  // --------------------------------
  // TOGGLE PUBLISH
  // --------------------------------

  async function handleTogglePublish(video) {
    try {
      setActionMessage("");
      setActionError("");

      const res = await api.patch(
        `/videos/toggle/publish/${video._id}`
      );

      const updatedVideo = res.data.data;

      setVideos((currentVideos) =>
        currentVideos.map(
          (currentVideo) =>
            currentVideo._id ===
            updatedVideo._id
              ? {
                  ...currentVideo,
                  ...updatedVideo,
                }
              : currentVideo
        )
      );

      setActionMessage(
        updatedVideo.isPublished
          ? "Video published successfully."
          : "Video unpublished successfully."
      );
    } catch (err) {
      console.error(
        "TOGGLE PUBLISH ERROR:",
        err
      );

      setActionError(
        err.response?.data?.message ||
          "Could not update publish status."
      );

      setActionMessage("");
    }
  }

  // --------------------------------
  // SUBSCRIBE
  // --------------------------------

  async function handleSubscribe() {
    try {
      await toggleSubscription(channel._id);

      await loadChannel();
    } catch (err) {
      console.error(
        "SUBSCRIBE ERROR:",
        err
      );

      setActionError(
        err.response?.data?.message ||
          "Please log in to subscribe."
      );

      setActionMessage("");
    }
  }

  // --------------------------------
  // MESSAGE HANDLER
  // --------------------------------

  function handleMessage(
    successMessage = "",
    errorMessage = ""
  ) {
    setActionMessage(successMessage);
    setActionError(errorMessage);
  }

  // --------------------------------
  // CLOSE ACTIVE SECTION
  // --------------------------------

  function closeActiveSection() {
    setActiveSection(null);

    setActionMessage("");
    setActionError("");
  }

  // --------------------------------
  // OUTSIDE CLICK
  // --------------------------------

  useEffect(() => {
    function handleOutsideClick(e) {
      if (
        messageRef.current &&
        !messageRef.current.contains(e.target)
      ) {
        setActionMessage("");
        setActionError("");
      }
    }

    if (actionMessage || actionError) {
      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [
    actionMessage,
    actionError,
  ]);

  // --------------------------------
  // PROFILE UPDATED
  // --------------------------------

  async function handleProfileUpdated(newUserName) {
    try {
        // Refresh AuthContext with the latest user data
        const updatedUser = await refreshUser();

        // Use the username returned from AuthContext.
        // Fall back to the username submitted by ProfileEditor.
        const username =
        updatedUser?.userName || newUserName;

        if (!username) {
        throw new Error("Updated username is missing.");
        }

        // Move to the new channel URL.
        navigate(`/channel/${username}`);
        
        setActionMessage(
        "Profile updated successfully."
        );

        setActionError("");
    } catch (err) {
        console.error(
        "PROFILE UPDATE ERROR:",
        err
        );

        setActionError(
        "Profile was updated, but the channel could not be refreshed."
        );

        setActionMessage("");
    }
    }

  // --------------------------------
  // AVATAR / COVER UPDATED
  // --------------------------------

  async function handleChannelUpdate() {
    await loadChannel();
  }

  // --------------------------------
  // VIDEO UPLOAD SUCCESS
  // --------------------------------

  async function handleVideoUploadSuccess() {
    setActiveSection(null);

    setActionError("");

    setActionMessage(
      "Video published successfully."
    );

    if (channel?._id) {
      await loadVideos(channel._id);
    }
  }

  // --------------------------------
  // EDIT VIDEO
  // --------------------------------

  function handleEditVideo(video) {
    setActionMessage("");
    setActionError("");

    setEditingVideo(video);
  }

  function handleEditClose() {
    setEditingVideo(null);
  }

  async function handleVideoUpdated(
    updatedVideo
  ) {
    setVideos((currentVideos) =>
      currentVideos.map((video) =>
        video._id === updatedVideo._id
          ? updatedVideo
          : video
      )
    );

    setEditingVideo(null);

    setActionMessage(
      "Video updated successfully."
    );

    setActionError("");
  }

  // --------------------------------
  // DELETE MODAL
  // --------------------------------

  function openDeleteModal(video) {
    setActionMessage("");
    setActionError("");

    setDeletingVideo(video);
  }

  function closeDeleteModal() {
    setDeletingVideo(null);
  }

  // --------------------------------
  // LOADING
  // --------------------------------

  if (loading) {
    return (
      <Layout showSidebar={false}>
        <p className="text-muted">
          Loading channel...
        </p>
      </Layout>
    );
  }

  // --------------------------------
  // ERROR
  // --------------------------------

  if (error || !channel) {
    return (
      <Layout showSidebar={false}>
        <p className="text-danger">
          {error}
        </p>
      </Layout>
    );
  }

  // --------------------------------
  // OWN CHANNEL
  // --------------------------------

  const isOwnChannel =
    user?.userName === channel.userName;

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <Layout showSidebar={false}>

      {/* CHANNEL HEADER */}

      <ChannelHeader
        channel={channel}
        isOwnChannel={isOwnChannel}
        onChannelUpdate={handleChannelUpdate}
        onSubscribe={handleSubscribe}
        onMessage={handleMessage}
      />

      {/* CHANNEL STATS (OWN CHANNEL ONLY) */}

      {isOwnChannel && stats && (
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(140px,1fr))] my-6">
          <div className="p-4 rounded-lg border border-border bg-surface text-center">
            <p className="text-xl font-semibold">{stats.totalSubscribers}</p>
            <p className="text-xs text-muted mt-1">Subscribers</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface text-center">
            <p className="text-xl font-semibold">{stats.totalVideos}</p>
            <p className="text-xs text-muted mt-1">Videos</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface text-center">
            <p className="text-xl font-semibold">{stats.totalPlaylists}</p>
            <p className="text-xs text-muted mt-1">Playlists</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface text-center">
            <p className="text-xl font-semibold">{stats.totalPosts}</p>
            <p className="text-xs text-muted mt-1">Posts</p>
          </div>
        </div>
      )}

      {/* SUCCESS / ERROR MESSAGE */}

      {(actionMessage || actionError) && (
        <div
          ref={messageRef}
          className={`mt-4 mb-4 p-4 rounded-lg border ${
            actionError
              ? "border-red-500/40 bg-red-500/10 text-red-400"
              : "border-green-500/40 bg-green-500/10 text-green-400"
          }`}
        >
          {actionMessage || actionError}
        </div>
      )}

      {/* VIDEO UPLOAD */}

      {activeSection === "upload" && (
        <VideoUpload
          onClose={closeActiveSection}
          onMessage={handleMessage}
          onUploaded={
            handleVideoUploadSuccess
          }
        />
      )}

      {/* ACCOUNT SETTINGS */}

      {/* Note: refreshUser is deliberately NOT passed down here. handleProfileUpdated()
          below already calls refreshUser() and navigates once the save completes;
          wiring it through AccountSettings/ProfileEditor too would just double the
          network call. */}
      {isOwnChannel && (
        <AccountSettings
          user={channel}
          onProfileUpdate={handleProfileUpdated}
        />
      )}

      {/* EDIT VIDEO */}

      {editingVideo && (
        <EditVideo
          video={editingVideo}
          onClose={handleEditClose}
          onUpdated={handleVideoUpdated}
        />
      )}

      {/* VIDEOS */}

      <h2 className="text-base mb-4 ml-2 mt-8">
        Videos
      </h2>

      {videos.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="text-text font-semibold text-base mb-1.5">
            No videos uploaded
          </p>

          <p>
            This channel hasn't uploaded a video yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-x-4 gap-y-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={{
                ...video,
                owner: {
                  userName:
                    channel.userName,
                  avatar:
                    channel.avatar,
                },
              }}
              isOwnVideo={isOwnChannel}
              onEdit={handleEditVideo}
              onDelete={openDeleteModal}
              onTogglePublish={
                handleTogglePublish
              }
            />
          ))}
        </div>
      )}

      {/* PLAYLISTS */}

      {playlists.length > 0 && (
        <>
          <h2 className="text-base mb-4 ml-2 mt-10">
            Playlists
          </h2>

          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
            {playlists.map((playlist) => (
              <Link
                key={playlist._id}
                to={`/playlists/${playlist._id}`}
                className="block p-4 rounded-lg border border-border bg-surface hover:bg-bg transition"
              >
                <p className="font-semibold text-text truncate">
                  {playlist.name}
                </p>
                <p className="text-sm text-muted mt-1 line-clamp-2">
                  {playlist.description}
                </p>
                <p className="text-xs text-muted mt-3">
                  {playlist.video?.length || 0} video
                  {playlist.video?.length === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* POSTS (TWEETS) */}

      <TweetSection
        channelId={channel._id}
        isOwnChannel={isOwnChannel}
        canLike={Boolean(user)}
      />

      {/* DELETE VIDEO MODAL */}

      {deletingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">

          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">

            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">

              <div>
                <h2 className="text-lg font-semibold text-text">
                  Delete video?
                </h2>

                <p className="mt-2 text-sm text-muted">
                  Are you sure you want to
                  delete this video?
                  This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                className="text-muted hover:text-text text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* VIDEO INFO */}

            <div className="flex gap-3 mt-5 p-3 rounded-lg bg-background">

              <img
                src={
                  deletingVideo.thumbnail
                }
                alt={deletingVideo.title}
                className="w-24 h-14 object-cover rounded-md shrink-0"
              />

              <div className="min-w-0">
                <p className="text-sm font-medium text-text line-clamp-2">
                  {deletingVideo.title}
                </p>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="flex justify-end gap-3 mt-6">

              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-4 py-2 rounded-lg border border-border text-text text-sm font-medium hover:bg-background transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteVideo}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
              >
                Delete
              </button>

            </div>

          </div>
        </div>
      )}

    </Layout>
  );
}
