import React from 'react';
import { Feather, Shield, Bookmark, Home } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'poet' | 'favorites' | 'admin' | 'admin-login' | 'admin-dashboard';
  onNavigateHome: () => void;
  onNavigateFavorites: () => void;
  onNavigateAdmin: () => void;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateHome,
  onNavigateFavorites,
  onNavigateAdmin,
  favoritesCount,
}) => {
  return (
    <header
      id="app-main-header"
      className="sticky top-0 z-40 bg-[#fbf9f6]/95 backdrop-blur-md border-b border-stone-200/80 transition-all"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
        {/* Brand / App Name */}
        <button
          id="app-brand-btn"
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 cursor-pointer group select-none text-right"
        >
          <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
            <Feather className="w-4 h-4 text-amber-200/90" />
          </div>
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-stone-900 font-sans-ui">
                Harf-e-Qalam
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100/70 text-amber-900 font-medium font-sans-ui">
                اردو
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-nastaliq leading-none -mt-0.5">
              حرفِ قلم
            </span>
          </div>
        </button>

        {/* Header Navigation Actions */}
        <div className="flex items-center gap-2">
          {/* Home Button (when not on home) */}
          {currentView !== 'home' && (
            <button
              id="header-home-btn"
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              title="صفحہ اول (Home)"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="font-nastaliq text-xs">شعراء</span>
            </button>
          )}

          {/* Favorites Button */}
          <button
            id="header-fav-btn"
            type="button"
            onClick={onNavigateFavorites}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentView === 'favorites'
                ? 'bg-amber-100 text-amber-950 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
            title="پسندیدہ کلام (Saved)"
          >
            <Bookmark className={`w-3.5 h-3.5 ${currentView === 'favorites' ? 'fill-amber-600 text-amber-600' : 'text-stone-500'}`} />
            <span className="hidden sm:inline font-nastaliq text-xs">پسندیدہ</span>
            {favoritesCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-stone-200 text-stone-800 font-sans-ui font-semibold">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Admin Panel Button */}
          <button
            id="view-toggle-btn"
            type="button"
            onClick={onNavigateAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans-ui font-medium border transition-all cursor-pointer ${
              currentView === 'admin' || currentView === 'admin-login' || currentView === 'admin-dashboard'
                ? 'bg-stone-900 text-amber-50 border-stone-900 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200/90 hover:border-stone-300 hover:bg-stone-50 shadow-2xs'
            }`}
            title="Admin Dashboard"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-xs">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
