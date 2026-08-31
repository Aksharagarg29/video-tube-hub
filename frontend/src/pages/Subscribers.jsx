import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getChannelSubscribers,
  getSubscribedChannels,
} from "../api/subscription.api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function Subscribers() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("subscribers"); // "subscribers" | "subscribed"
  const [subscribers, setSubscribers] = useState([]);
  const [subscribed, setSubscribed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [subscribersRes, subscribedRes] = await Promise.all([
        getChannelSubscribers(user._id),
        getSubscribedChannels(user._id),
      ]);
      setSubscribers(subscribersRes.data.data || []);
      setSubscribed(subscribedRes.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load subscriptions."));
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
            Log in to see your subscribers and subscriptions.
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

  const list = tab === "subscribers" ? subscribers : subscribed;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Subscribers</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("subscribers")}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
            tab === "subscribers"
              ? "border-primary bg-primary text-white"
              : "border-border text-text hover:bg-surface"
          }`}
        >
          Your subscribers ({subscribers.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("subscribed")}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
            tab === "subscribed"
              ? "border-primary bg-primary text-white"
              : "border-border text-text hover:bg-surface"
          }`}
        >
          Channels you follow ({subscribed.length})
        </button>
      </div>

      {loading && <p className="text-muted">Loading...</p>}

      {!loading && error && <p className="text-danger">{error}</p>}

      {!loading && !error && list.length === 0 && (
        <div className="text-center py-20 text-muted">
          <p className="text-text font-semibold text-base mb-1.5">
            {tab === "subscribers"
              ? "No subscribers yet"
              : "You haven't subscribed to any channels"}
          </p>
        </div>
      )}

      {!loading && !error && list.length > 0 && (
        <div className="flex flex-col gap-2">
          {list.map((entry) => {
            const person =
              tab === "subscribers" ? entry.subscriber : entry.channel;
            if (!person) return null;
            return (
              <Link
                key={entry._id}
                to={`/channel/${person.userName}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface transition"
              >
                <img
                  className="w-10 h-10 rounded-full object-cover"
                  src={person.avatar || "https://placehold.co/40x40"}
                  alt={person.userName}
                />
                <div>
                  <p className="text-sm font-semibold">{person.fullName}</p>
                  <p className="text-xs text-muted">@{person.userName}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
