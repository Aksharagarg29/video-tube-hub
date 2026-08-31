import { Link } from "react-router-dom";

function timeAgo(dateString) {
  const seconds = Math.floor(
    (new Date() - new Date(dateString)) / 1000
  );

  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [name, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);

    if (value >= 1) {
      return `${value} ${name}${value > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

export default function VideoCard({
  video,
  isOwnVideo = false,
  onEdit,
  onDelete,
  onTogglePublish,
}) {
  return (
    <div className="relative">
      <Link to={`/watch/${video._id}`} className="block">
        <img
          className="w-full aspect-video object-cover rounded-lg bg-surface"
          src={video.thumbnail}
          alt={video.title}
        />

        <div className="flex gap-2.5 mt-2.5">
          {video.owner?.avatar && (
            <img
              className="w-9 h-9 rounded-full object-cover shrink-0"
              src={video.owner.avatar}
              alt=""
            />
          )}

          <div>
            <p className="m-0 mb-1 text-sm font-semibold leading-snug line-clamp-2">
              {video.title}
            </p>

            <p className="m-0 text-[13px] text-muted">
              {video.owner?.userName && (
                <>
                  {video.owner.userName} ·{" "}
                </>
              )}

              {video.views ?? 0} views ·{" "}
              {video.likeCount ?? 0} likes ·{" "}
              {timeAgo(video.createdAt)}
            </p>
          </div>
        </div>
      </Link>

      {/* OWNER CONTROLS */}

      {isOwnVideo && (
        <div className="flex flex-wrap gap-2 mt-3">
          {/* EDIT */}

          <button
            type="button"
            onClick={() => onEdit?.(video)}
            className="px-3 py-1.5 rounded-lg border border-border text-text text-xs font-medium hover:bg-surface transition"
          >
            Edit
          </button>

          {/* TOGGLE PUBLISH */}

          <button
            type="button"
            onClick={() => onTogglePublish?.(video)}
            className="px-3 py-1.5 rounded-lg border border-border text-text text-xs font-medium hover:bg-surface transition"
          >
            {video.isPublished ? "Unpublish" : "Publish"}
          </button>

          {/* DELETE */}

          <button
            type="button"
            onClick={() => onDelete?.(video)}
            className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-xs font-medium hover:bg-red-500/10 transition"
          >
            Delete
          </button>
        </div>
      )}

      {/* PUBLISH STATUS */}

      {isOwnVideo && (
        <p className="mt-2 text-xs text-muted">
          Status:{" "}
          <span
            className={
              video.isPublished
                ? "text-green-400"
                : "text-yellow-400"
            }
          >
            {video.isPublished ? "Published" : "Unpublished"}
          </span>
        </p>
      )}
    </div>
  );
}
