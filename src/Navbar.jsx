import { useState, useRef, useEffect } from "react";

const STORAGE_KEY = "yt-clone-recent-searches";
const MAX_RECENT = 10;

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

const loadRecent = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveRecent = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable (private mode, quota) - ignore */
  }
};

const Icon = ({ name, className = "" }) => (
  <span
    className={`material-symbols-outlined select-none ${className}`}
    aria-hidden="true"
  >
    {name}
  </span>
);

const IconButton = ({ icon, label, onClick, badge = 0, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={badge ? `${label} (${badge} new)` : label}
    title={label}
    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full
      transition-colors hover:bg-white/10 active:bg-white/20
      focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400
      ${className}`}
  >
    <Icon name={icon} />
    {badge > 0 && (
      <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium leading-none">
        {badge > 9 ? "9+" : badge}
      </span>
    )}
  </button>
);

const Logo = () => (
  <a
    href="/"
    aria-label="YouTube home"
    className="flex items-center gap-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
  >
    <svg viewBox="0 0 28 20" className="h-5 w-7" aria-hidden="true">
      <rect width="28" height="20" rx="5" fill="#FF0000" />
      <path d="M11 6l7 4-7 4z" fill="#fff" />
    </svg>
    <span className="hidden text-xl font-semibold tracking-tighter sm:inline">
      YouTube
    </span>
  </a>
);

function Navbar({
  onSearch,
  onMenuClick,
  onCreate,
  onSignIn,
  user, // { name, avatar } - omit when signed out
  notificationCount = 0,
}) {
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState(loadRecent);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [listening, setListening] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const inputRef = useRef(null);
  const boxRef = useRef(null);

  const query = search.trim().toLowerCase();
  const suggestions = (
    query ? recent.filter((r) => r.toLowerCase().includes(query)) : recent
  ).slice(0, 8);
  const dropdownOpen = showSuggestions && suggestions.length > 0;

  // Focus the input when the mobile search opens
  useEffect(() => {
    if (mobileSearchOpen) inputRef.current?.focus();
  }, [mobileSearchOpen]);

  // Escape closes suggestions and the mobile search
  useEffect(() => {
    if (!mobileSearchOpen && !showSuggestions) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setShowSuggestions(false);
      setMobileSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileSearchOpen, showSuggestions]);

  // Click outside closes the suggestions
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const submitQuery = (value) => {
    const q = value.trim();
    if (!q) return;

    const next = [q, ...recent.filter((r) => r !== q)].slice(0, MAX_RECENT);
    setRecent(next);
    saveRecent(next);

    setSearch(q);
    setShowSuggestions(false);
    setActiveIndex(-1);
    setMobileSearchOpen(false);
    inputRef.current?.blur();
    onSearch?.(q);
  };

  const removeRecent = (item) => {
    const next = recent.filter((r) => r !== item);
    setRecent(next);
    saveRecent(next);
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitQuery(activeIndex >= 0 ? suggestions[activeIndex] : search);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!suggestions.length) return;
      e.preventDefault();
      setShowSuggestions(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (i) => (i + step + suggestions.length) % suggestions.length,
      );
    }
  };

  const startVoiceSearch = () => {
    if (!SpeechRecognition || listening) return;
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e) => submitQuery(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-2 bg-[#0f0f0f] px-2 text-white sm:px-4">
      {/* Left: menu + logo (hidden on mobile while search is open) */}
      <div
        className={`items-center gap-1 sm:gap-3 ${
          mobileSearchOpen ? "hidden sm:flex" : "flex"
        }`}
      >
        <IconButton icon="menu" label="Menu" onClick={onMenuClick} />
        <Logo />
      </div>

      {/* Center: search */}
      <form
        onSubmit={handleSubmit}
        role="search"
        className={`min-w-0 flex-1 items-center justify-center sm:mx-4 sm:flex ${
          mobileSearchOpen ? "flex" : "hidden"
        }`}
      >
        {mobileSearchOpen && (
          <IconButton
            icon="arrow_back"
            label="Close search"
            onClick={() => setMobileSearchOpen(false)}
            className="sm:hidden"
          />
        )}

        <div
          ref={boxRef}
          className="relative flex w-full max-w-[600px] items-center"
        >
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            placeholder="Search"
            aria-label="Search videos"
            aria-expanded={dropdownOpen}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
            }
            autoComplete="off"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="h-10 w-full rounded-l-full border border-[#303030] bg-[#121212] pl-5 pr-10
              text-white outline-none placeholder:text-gray-400
              focus:border-blue-500 [&::-webkit-search-cancel-button]:hidden"
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10"
            >
              <Icon name="close" className="!text-[20px]" />
            </button>
          )}

          {/* Recent searches */}
          {dropdownOpen && (
            <ul
              id="search-suggestions"
              role="listbox"
              aria-label="Recent searches"
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[#303030] bg-[#212121] py-2 shadow-xl"
            >
              {suggestions.map((item, i) => (
                <li
                  key={item}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => submitQuery(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-1.5 ${
                    i === activeIndex ? "bg-white/10" : ""
                  }`}
                >
                  <Icon name="history" className="text-gray-300" />
                  <span className="min-w-0 flex-1 truncate">{item}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecent(item);
                    }}
                    aria-label={`Remove "${item}" from history`}
                    title="Remove"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white"
                  >
                    <Icon name="close" className="!text-[18px]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          aria-label="Search"
          disabled={!search.trim()}
          className="flex h-10 w-16 shrink-0 items-center justify-center rounded-r-full
            border border-l-0 border-[#303030] bg-[#222222] transition-colors
            hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          <Icon name="search" />
        </button>

        {SpeechRecognition && (
          <button
            type="button"
            onClick={startVoiceSearch}
            aria-label={listening ? "Listening..." : "Search with your voice"}
            title="Search with your voice"
            className={`ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400
              ${listening ? "animate-pulse bg-red-600" : "bg-[#222222] hover:bg-[#303030]"}`}
          >
            <Icon name="mic" />
          </button>
        )}
      </form>

      {/* Right: actions */}
      <div
        className={`items-center gap-1 sm:gap-2 ${
          mobileSearchOpen ? "hidden sm:flex" : "flex"
        }`}
      >
        <IconButton
          icon="search"
          label="Open search"
          onClick={() => setMobileSearchOpen(true)}
          className="sm:hidden"
        />

        <button
          type="button"
          onClick={onCreate}
          className="hidden h-9 items-center gap-1 rounded-full bg-white/10 pl-3 pr-4 text-sm font-medium
            transition-colors hover:bg-white/20 sm:flex
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          <Icon name="add" className="!text-[22px]" />
          Create
        </button>

        <IconButton
          icon="notifications"
          label="Notifications"
          badge={notificationCount}
        />

        {user ? (
          <button
            type="button"
            aria-label={`Account: ${user.name || "You"}`}
            title={user.name || "Account"}
            className="ml-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-violet-600 text-sm font-medium
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              (user.name || "?").charAt(0).toUpperCase()
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="flex h-9 items-center gap-2 rounded-full border border-[#3f3f3f] px-3 text-sm font-medium text-sky-400
              transition-colors hover:bg-sky-400/10
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
          >
            <Icon name="account_circle" className="!text-[24px]" />
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}

export default Navbar;
