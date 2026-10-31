import { useEffect } from "react";

/**
 * Each section: { id, title?, chevron?, items: [...] }
 * Each item:    { id, icon, name, miniOnly? }
 *  - miniOnly: shown only when the sidebar is collapsed (like YouTube's "You" tab)
 */
const SECTIONS = [
  {
    id: "main",
    items: [
      { id: "home", icon: "home", name: "Home" },
      { id: "shorts", icon: "smart_display", name: "Shorts" },
      { id: "subscriptions", icon: "subscriptions", name: "Subscriptions" },
      { id: "you", icon: "video_library", name: "You", miniOnly: true },
    ],
  },
  {
    id: "you",
    title: "You",
    chevron: true,
    items: [
      { id: "history", icon: "history", name: "History" },
      { id: "playlists", icon: "playlist_play", name: "Playlists" },
      { id: "your-videos", icon: "slideshow", name: "Your videos" },
      { id: "watch-later", icon: "schedule", name: "Watch later" },
      { id: "liked", icon: "thumb_up", name: "Liked videos" },
    ],
  },
  {
    id: "explore",
    title: "Explore",
    items: [
      { id: "trending", icon: "local_fire_department", name: "Trending" },
      { id: "shopping", icon: "shopping_bag", name: "Shopping" },
      { id: "music", icon: "music_note", name: "Music" },
      { id: "movies", icon: "movie", name: "Movies" },
      { id: "live", icon: "sensors", name: "Live" },
      { id: "gaming", icon: "sports_esports", name: "Gaming" },
      { id: "news", icon: "newspaper", name: "News" },
      { id: "sports", icon: "emoji_events", name: "Sports" },
      { id: "learning", icon: "lightbulb", name: "Learning" },
      { id: "fashion", icon: "checkroom", name: "Fashion & Beauty" },
      { id: "podcasts", icon: "podcasts", name: "Podcasts" },
    ],
  },
  {
    id: "settings",
    items: [
      { id: "settings", icon: "settings", name: "Settings" },
      { id: "report", icon: "flag", name: "Report history" },
      { id: "help", icon: "help", name: "Help" },
      { id: "feedback", icon: "feedback", name: "Send feedback" },
    ],
  },
];

const FOOTER_LINKS = [
  "About",
  "Press",
  "Copyright",
  "Contact us",
  "Creators",
  "Advertise",
  "Developers",
  "Terms",
  "Privacy",
  "Policy & Safety",
  "How it works",
];

const isMobileViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 639px)").matches;

function SidebarItem({ item, active, compact, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={item.name}
      className={`flex w-full items-center rounded-lg text-left transition-colors hover:bg-white/10
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400
        ${active ? "bg-white/10 font-medium" : ""}
        ${
          compact
            ? "flex-col gap-1 px-1 py-4 text-center text-[10px]"
            : "gap-6 px-3 py-2 text-sm"
        }`}
    >
      <span
        className="material-symbols-outlined shrink-0"
        aria-hidden="true"
        style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}
      >
        {item.icon}
      </span>
      <span className="truncate">{item.name}</span>
    </button>
  );
}

function Sidebar({
  isOpen = true,
  activeId = "home",
  onSelect,
  onClose,
  sections = SECTIONS,
}) {
  // Close the mobile drawer with Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleClick = (item) => {
    onSelect?.(item.id, item);
    // Only auto-close the drawer on phones; desktop keeps its state
    if (isMobileViewport()) onClose?.();
  };

  // Collapsed rail: only the first section (plus "You"), no titles/dividers
  const visibleSections = isOpen
    ? sections.map((s) => ({
        ...s,
        items: s.items.filter((i) => !i.miniOnly),
      }))
    : [
        {
          id: "mini",
          items: sections[0].items,
        },
      ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-14 z-30 bg-black/60 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`z-40 shrink-0 overflow-y-auto bg-[#0f0f0f] text-white
          [scrollbar-color:#3f3f3f_transparent] [scrollbar-width:thin]
          ${isOpen ? "fixed bottom-0 left-0 top-14 w-60" : "hidden"}
          sm:sticky sm:top-14 sm:block sm:h-[calc(100vh-3.5rem)]
          ${isOpen ? "sm:w-60" : "sm:w-[72px]"}`}
      >
        <nav aria-label="Main" className={isOpen ? "p-3" : "px-1 py-3"}>
          {visibleSections.map((section, index) => (
            <div
              key={section.id}
              className={
                isOpen && index > 0 ? "mt-3 border-t border-[#303030] pt-3" : ""
              }
            >
              {isOpen && section.title && (
                <h2 className="flex items-center gap-1 px-3 py-1.5 text-base font-semibold">
                  {section.title}
                  {section.chevron && (
                    <span
                      className="material-symbols-outlined !text-[20px]"
                      aria-hidden="true"
                    >
                      chevron_right
                    </span>
                  )}
                </h2>
              )}

              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <SidebarItem
                      item={item}
                      compact={!isOpen}
                      active={item.id === activeId}
                      onClick={() => handleClick(item)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {isOpen && (
          <footer className="px-6 pb-6 pt-1 text-xs font-medium text-gray-400">
            <p className="leading-5">{FOOTER_LINKS.slice(0, 7).join("  ")}</p>
            <p className="mt-2 leading-5">{FOOTER_LINKS.slice(7).join("  ")}</p>
            <p className="mt-4 font-normal text-gray-500">
              &copy; {new Date().getFullYear()} YouTube Clone
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}

export default Sidebar;