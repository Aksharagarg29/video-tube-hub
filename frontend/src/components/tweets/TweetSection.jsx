import { useEffect, useState } from "react";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../../api/tweet.api";
import { getErrorMessage } from "../../utils/getErrorMessage";
import TweetItem from "./TweetItem";

export default function TweetSection({ channelId, isOwnChannel, canLike }) {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!channelId) return;
    loadTweets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  async function loadTweets() {
    setLoading(true);
    setError("");
    try {
      const res = await getUserTweets(channelId);
      setTweets(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load posts."));
    } finally {
      setLoading(false);
    }
  }

  async function handlePost(event) {
    event.preventDefault();
    setFormError("");
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      await createTweet(content.trim());
      setContent("");
      await loadTweets();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not post."));
    } finally {
      setPosting(false);
    }
  }

  async function handleUpdate(tweetId, newContent) {
    const res = await updateTweet(tweetId, newContent);
    const updated = res.data.data;
    setTweets((prev) => prev.map((tweet) => (tweet._id === tweetId ? { ...tweet, content: updated.content } : tweet)));
  }

  async function handleDelete(tweetId) {
    await deleteTweet(tweetId);
    setTweets((prev) => prev.filter((tweet) => tweet._id !== tweetId));
  }

  if (!loading && !error && tweets.length === 0 && !isOwnChannel) return null;

  return (
    <>
      <h2 className="text-base mb-4 ml-2 mt-10">Posts</h2>

      {isOwnChannel && (
        <form onSubmit={handlePost} className="flex gap-3 mb-4">
          <input
            className="input flex-1"
            placeholder="Share something"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <button className="btn btn-primary" disabled={posting}>
            {posting ? "Posting..." : "Post"}
          </button>
        </form>
      )}

      {formError && <p className="text-danger text-sm mb-3">{formError}</p>}
      {error && <p className="text-danger text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-muted">Loading posts...</p>
      ) : tweets.length === 0 ? (
        <p className="text-muted text-sm">No posts yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tweets.map((tweet) => (
            <TweetItem
              key={tweet._id}
              tweet={tweet}
              canLike={canLike}
              isOwner={isOwnChannel}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onError={setError}
            />
          ))}
        </div>
      )}
    </>
  );
}
