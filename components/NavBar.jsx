// components/NavBar.jsx
"use client";

export default function NavBar({
  favoritesCount = 0,
  showOnlyFavorites,
  setShowOnlyFavorites,
  onExportCSV,
  onOpenEmailModal,
}) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur border-b border-purple-100">
      <nav className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Left: Brand */}
          <a href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.webp"
              alt="Logo"
              className="w-9 h-9 object-contain"
            />
            <span className="text-xl font-extrabold text-purple-800 group-hover:text-purple-900 transition">
              Youdemonia
            </span>
          </a>

          {/* Center: Links */}
          <div className="hidden md:flex items-center gap-6">
            <button
              className={`text-sm font-semibold transition ${
                !showOnlyFavorites ? "text-purple-800" : "text-gray-600"
              } hover:text-purple-900`}
              onClick={() => setShowOnlyFavorites(false)}
            >
              Opportunities
            </button>

            <button
              className={`relative text-sm font-semibold transition ${
                showOnlyFavorites ? "text-purple-800" : "text-gray-600"
              } hover:text-purple-900`}
              onClick={() => setShowOnlyFavorites(true)}
            >
              Favorites
              <span className="ml-2 inline-flex items-center justify-center text-xs font-bold rounded-full bg-purple-100 text-purple-800 px-2 py-[2px]">
                {favoritesCount}
              </span>
            </button>

            <a
              href="/submit"
              className="text-sm font-semibold text-gray-600 hover:text-purple-900 transition"
            >
              Submit an Opportunity
            </a>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              className="hidden sm:inline-flex bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold h-9 px-4 rounded-full transition"
              onClick={onExportCSV}
            >
              Export Favorites
            </button>

            <button
              className="hidden sm:inline-flex bg-red-700 hover:bg-red-800 text-white text-sm font-bold h-9 px-4 rounded-full transition"
              onClick={onOpenEmailModal}
            >
              Email Favorites
            </button>

            {/* Mobile menu (quick toggles) */}
            <div className="md:hidden flex items-center gap-2">
              <button
                className="text-xs font-semibold bg-purple-100 text-purple-800 rounded-full px-3 py-1"
                onClick={() => setShowOnlyFavorites((v) => !v)}
                aria-pressed={showOnlyFavorites}
              >
                {showOnlyFavorites ? "Favs On" : "Favs Off"}
              </button>
              <button
                className="text-xs font-semibold bg-purple-700 text-white rounded-full px-3 py-1"
                onClick={onExportCSV}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
