import { useState } from "react";

// YouTube API returns titles with HTML entities (e.g. &amp; &#39; &quot;)
const decodeHtml = (str = "") => {
  const doc = new DOMParser().parseFromString(str, "text/html");
  return doc.documentElement.textContent || "";
};

// "2026-10-01T10:00:00Z" -> "4 weeks ago"
const timeAgo = (dateString) => {
  if (!dateString) return "";
  const seconds = Math.round((new Date(dateString) - Date.now()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, secs] of units) {
    if (Math.abs(seconds) >= secs) {
      return rtf.format(Math.round(seconds / secs), unit);
    }
  }
  return "just now";
};

// "PT1H2M3S" -> "1:02:03", "PT4M9S" -> "4:09"
const formatDuration = (iso) => {
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(
    iso || "",
  );
  if (!match) return "";
  const [d, h, m, s] = match.slice(1).map((v) => Number(v || 0));
  if (!d && !h && !m && !s) return ""; // live streams report zero length
  const pad = (n) => String(n).padStart(2, "0");
  const hours = d * 24 + h;
  return hours ? `${hours}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

// "1234567" -> "1.2M views"
const formatViews = (count) => {
  if (count === undefined || count === null || count === "") return "";
  const n = Number(count);
  if (Number.isNaN(n)) return "";
  const short = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
  return `${short} view${n === 1 ? "" : "s"}`;
};

const AVATAR_COLORS = [
  "bg-red-600",
  "bg-orange-600",
  "bg-emerald-600",
  "bg-sky-600",
  "bg-violet-600",
  "bg-pink-600",
];

const colorFor = (text = "") =>
  AVATAR_COLORS[
    [...text].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) %
      AVATAR_COLORS.length
  ];

function ChannelAvatar({ name, src }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium text-white ${colorFor(
        name,
      )}`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}

/**
 * Props
 *  - video: YouTube API item. Works with search results (snippet only).
 *           If you also fetch /videos?part=contentDetails,statistics and merge
 *           them in, the card shows duration and view count.
 *  - channelAvatar: optional URL of the channel's profile picture
 *  - onMore: optional click handler for the three-dot menu
 */
function VideoCard({ video,channelAvatar, onMore }) {
  const [imgFailed, setImgFailed] = useState(false);

  const { snippet, id, contentDetails, statistics } = video || {};
  const videoId = typeof id === "string" ? id : id?.videoId;

  // Skip results that aren't playable videos (e.g. channels/playlists)
  if (!snippet || !videoId) return null;

  const title = decodeHtml(snippet.title);
  const channel = decodeHtml(snippet.channelTitle);
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const channelUrl = snippet.channelId
    ? `https://www.youtube.com/channel/${snippet.channelId}`
    : undefined;

  const thumbnail =
    snippet.thumbnails?.medium?.url ||
    snippet.thumbnails?.high?.url ||
    snippet.thumbnails?.default?.url;

  const duration = formatDuration(contentDetails?.duration);
  const meta = [
    formatViews(statistics?.viewCount),
    timeAgo(snippet.publishedAt),
  ]
    .filter(Boolean)
    .join(" • ");

  const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400";

  return (
    <article className="group w-full text-white">
      {/* Thumbnail */}
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={title}
        className={`relative block aspect-video w-full overflow-hidden rounded-xl bg-[#272727] ${focusRing}`}
      >
        {thumbnail && !imgFailed ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-500">
            <span
              className="material-symbols-outlined !text-5xl"
              aria-hidden="true"
            >
              videocam_off
            </span>
          </div>
        )}

        {duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium">
            {duration}
          </span>
        )}
      </a>

      {/* Details */}
      <div className="mt-3 flex gap-3">
        {channelUrl ? (
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Go to ${channel}`}
            className={`h-9 w-9 shrink-0 rounded-full ${focusRing}`}
          >
            <ChannelAvatar name={channel} src={channelAvatar} />
          </a>
        ) : (
          <div className="shrink-0">
            <ChannelAvatar name={channel} src={channelAvatar} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-medium text-black leading-snug">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={title}
              className={`rounded ${focusRing}`}
            >
              {title}
            </a>
          </h3>

          <div className="mt-1 text-sm text-gray-400">
            {channelUrl ? (
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`block truncate rounded hover:text-white ${focusRing}`}
              >
                {channel}
              </a>
            ) : (
              <p className="truncate">{channel}</p>
            )}
            {meta && <p>{meta}</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onMore?.(video)}
          aria-label="More actions"
          title="More"
          className={`-mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full
            opacity-100 transition-colors hover:bg-white/10 sm:opacity-0
            sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 ${focusRing}`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            more_vert
          </span>
        </button>
      </div>
    </article>
  );
}

export default VideoCard;
