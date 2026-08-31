import AvatarEditor from "./AvatarEditor";
import CoverEditor from "./CoverEditor";

export default function ChannelHeader({
  channel,
  isOwnChannel,
  onAvatarUpdated,
  onCoverUpdated,
  onMessage,
  onSubscribe,
}) {
  return (
    <div className="relative mb-20">

      {/* COVER */}

      {isOwnChannel ? (
        <CoverEditor
          coverImage={channel.coverImage}
          onUpdated={onCoverUpdated}
          onMessage={onMessage}
        />
      ) : (
        <div className="w-full h-[220px] rounded-xl overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500">
          {channel.coverImage && (
            <img
              className="w-full h-full object-cover"
              src={channel.coverImage}
              alt=""
            />
          )}
        </div>
      )}

      {/* CHANNEL INFO */}

      <div className="absolute left-0 right-0 -bottom-16 px-4">

        <div className="flex items-end gap-5">

          {/* AVATAR */}

          {isOwnChannel ? (
            <AvatarEditor
              avatar={channel.avatar}
              userName={channel.userName}
              onUpdated={onAvatarUpdated}
              onMessage={onMessage}
            />
          ) : (
            <img
              className="w-28 h-28 rounded-full object-cover border-4 border-bg bg-surface shadow-lg"
              src={
                channel.avatar ||
                "https://placehold.co/112x112"
              }
              alt={channel.userName}
              referrerPolicy="no-referrer"
            />
          )}

          {/* DETAILS */}

          <div className="pb-1 min-w-0 flex-1">

            <h1 className="text-2xl font-bold truncate">
              {channel.fullName}
            </h1>

            <p className="text-muted text-sm mt-1">
              @{channel.userName}
            </p>

            <p className="text-muted text-sm mt-1">
              {channel.subscribersCount} Subscribers ·{" "}
              {channel.channelsSubscribedToCount} Subscribed
            </p>

          </div>

          {/* SUBSCRIBE */}

          {!isOwnChannel && (
            <button
              className="btn btn-primary mb-1"
              onClick={onSubscribe}
            >
              {channel.isSubscribed
                ? "Subscribed"
                : "Subscribe"}
            </button>
          )}

        </div>

      </div>
    </div>
  );
}