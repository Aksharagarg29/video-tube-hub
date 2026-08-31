export default function LikeButton({ liked, likeCount, loading, onToggle, label = true, className = "" }) {
  return <button type="button" onClick={onToggle} disabled={loading} className={`group flex items-center gap-2 px-4 py-2 rounded-full border border-border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${liked ? "bg-surface text-text" : "text-text hover:bg-surface"} ${className}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className={`w-5 h-5 transition-transform ${liked ? "scale-110" : "group-hover:scale-110"}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 10.5h-3a1.5 1.5 0 0 0-1.5 1.5v6a1.5 1.5 0 0 0 1.5 1.5h3m0-9v9m0-9 2.25-5.25a1.75 1.75 0 0 1 3.37.86v3.89h4.88a2 2 0 0 1 1.96 2.39l-1.2 6a2 2 0 0 1-1.96 1.61H6.75" />
    </svg>
    {label && <span className="font-medium">{liked ? "Liked" : "Like"}</span>}
    <span className="text-sm opacity-80">{likeCount}</span>
  </button>;
}
