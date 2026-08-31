export default function SubscribeButton({ subscribed, loading, onToggle, className = "" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      className={`btn ${subscribed ? "" : "btn-primary"} disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {subscribed ? "Subscribed" : "Subscribe"}
    </button>
  );
}
