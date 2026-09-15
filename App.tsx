import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header.js';
import { HomeBanner } from './components/HomeBanner.js';
import { PoetPillButtons } from './components/PoetPillButtons.js';
import { PoetScreen } from './components/PoetScreen.js';
import { FavoritesScreen } from './components/FavoritesScreen.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { AdminLogin } from './components/AdminLogin.js';
import { SplashScreen } from './components/SplashScreen.js';
import { Toast } from './components/Toast.js';
import { Poet, Category, Poetry, Banner } from './types.js';
import { logoutFirebase } from './lib/firebase.js';

export default function App() {
  // Navigation states: 'home' | 'poet' | 'favorites' | 'admin-login' | 'admin-dashboard'
  const [currentView, setCurrentView] = useState<'home' | 'poet' | 'favorites' | 'admin-login' | 'admin-dashboard'>('home');
  const [selectedPoet, setSelectedPoet] = useState<Poet | null>(null);

  // Admin Security State
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('admin_token');
    } catch {
      return null;
    }
  });

  const [adminUsername, setAdminUsername] = useState<string>(() => {
    try {
      return sessionStorage.getItem('admin_username') || 'admin';
    } catch {
      return 'admin';
    }
  });

  const [poets, setPoets] = useState<Poet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [poetryList, setPoetryList] = useState<Poetry[]>([]);
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Splash screen dismiss timer (1.8 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Local storage for user bookmarked favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('urdu_poetry_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Fetch Categories from Database API
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch Poets from Database API (database-driven)
  const fetchPoets = useCallback(async () => {
    try {
      const res = await fetch('/api/poets');
      if (!res.ok) throw new Error('Failed to fetch poets');
      const data = await res.json();
      setPoets(data);
    } catch (err) {
      console.error('Error fetching poets:', err);
    }
  }, []);

  // Fetch Poetry from Database API
  const fetchPoetry = useCallback(async () => {
    try {
      const endpoint = currentView === 'admin-dashboard' ? '/api/poetry?status=all' : '/api/poetry?status=published';
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch poetry');
      const data = await res.json();
      setPoetryList(data);
    } catch (err) {
      console.error('Error fetching poetry:', err);
    }
  }, [currentView]);

  // Fetch Active Banner from Database API (for Home Screen)
  const fetchActiveBanner = useCallback(async () => {
    try {
      const res = await fetch('/api/banners/active');
      if (!res.ok) throw new Error('Failed to fetch active banners');
      const data = await res.json();
      const banner = Array.isArray(data) ? (data[0] || null) : data;
      setActiveBanner(banner);
    } catch (err) {
      console.error('Error fetching active banner:', err);
    }
  }, []);

  // Initial load and reload
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchCategories(), fetchPoets(), fetchPoetry(), fetchActiveBanner()]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCategories, fetchPoets, fetchPoetry, fetchActiveBanner]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Likes
  const handleLike = async (poetryId: string) => {
    try {
      const res = await fetch(`/api/poetry/${poetryId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to like');
      const data = await res.json();
      setPoetryList((prev) =>
        prev.map((p) => (p.id === poetryId ? { ...p, likesCount: data.likesCount } : p))
      );
    } catch (err) {
      console.error('Like error:', err);
      throw err;
    }
  };

  // Toggle favorite bookmark
  const handleToggleFavorite = (poetryId: string) => {
    setFavorites((prev) => {
      let updated: string[];
      if (prev.includes(poetryId)) {
        updated = prev.filter((id) => id !== poetryId);
        showToast('پسندیدہ سے ہٹا دیا گیا');
      } else {
        updated = [...prev, poetryId];
        showToast('پسندیدہ کلام میں شامل کر لیا گیا');
      }
      try {
        localStorage.setItem('urdu_poetry_favorites', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  // Navigate to Poet Screen on pill button tap
  const handleSelectPoet = (poet: Poet) => {
    setSelectedPoet(poet);
    setCurrentView('poet');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to Home
  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedPoet(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Navigation (Admin button -> Admin Login if not authenticated, else Admin Dashboard)
  const handleNavigateAdmin = () => {
    if (adminToken) {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('admin-login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Successful Login Handler
  const handleLoginSuccess = (token: string, username: string) => {
    setAdminToken(token);
    setAdminUsername(username);
    try {
      sessionStorage.setItem('admin_token', token);
      sessionStorage.setItem('admin_username', username);
    } catch (err) {
      console.error(err);
    }
    setCurrentView('admin-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Logout Handler (Logout -> Admin Login)
  const handleLogout = async () => {
    try {
      await logoutFirebase().catch(() => {});
      if (adminToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: adminToken }),
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
    setAdminToken(null);
    try {
      sessionStorage.removeItem('admin_token');
    } catch (err) {
      console.error(err);
    }
    showToast('Logged out successfully');
    setCurrentView('admin-login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      id="app-root"
      dir="rtl"
      className="min-h-screen bg-[#fbf9f6] text-stone-900 font-sans antialiased selection:bg-amber-100 selection:text-amber-900 flex flex-col"
    >
      {/* Simple, Elegant Splash Screen */}
      {showSplash && <SplashScreen />}

      {/* Toast Notifications */}
      {toastMessage && <Toast message={toastMessage} />}

      {/* Professional Compact Header */}
      <Header
        currentView={currentView}
        onNavigateHome={handleBackToHome}
        onNavigateFavorites={() => setCurrentView('favorites')}
        onNavigateAdmin={handleNavigateAdmin}
        favoritesCount={favorites.length}
      />

      {/* Main Content Area */}
      <main
        id="app-main-content"
        className={`flex-1 w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 ${
          currentView === 'admin-dashboard' ? 'max-w-4xl' : 'max-w-3xl'
        }`}
      >
        {/* ================= VIEW: ADMIN LOGIN ================= */}
        {currentView === 'admin-login' && (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onBackToHome={handleBackToHome}
            onShowToast={showToast}
          />
        )}

        {/* ================= VIEW: ADMIN DASHBOARD ================= */}
        {currentView === 'admin-dashboard' && (
          adminToken ? (
            <AdminDashboard
              categories={categories}
              poets={poets}
              onCategoriesUpdated={fetchCategories}
              onPoetsUpdated={fetchPoets}
              onPoetryUpdated={fetchPoetry}
              onBannerUpdated={fetchActiveBanner}
              onClose={handleBackToHome}
              onLogout={handleLogout}
              onShowToast={showToast}
              adminUsername={adminUsername}
            />
          ) : (
            <AdminLogin
              onLoginSuccess={handleLoginSuccess}
              onBackToHome={handleBackToHome}
              onShowToast={showToast}
            />
          )
        )}

        {/* ================= VIEW: FAVORITES SCREEN ================= */}
        {currentView === 'favorites' && (
          <FavoritesScreen
            favoriteIds={favorites}
            poetryList={poetryList}
            categories={categories}
            onBack={handleBackToHome}
            onToggleFavorite={handleToggleFavorite}
            onLike={handleLike}
            onShowToast={showToast}
          />
        )}

        {/* ================= VIEW: DEDICATED POET SCREEN ================= */}
        {currentView === 'poet' && selectedPoet && (
          <PoetScreen
            poet={selectedPoet}
            poetryList={poetryList}
            categories={categories}
            favoriteIds={favorites}
            onBack={handleBackToHome}
            onToggleFavorite={handleToggleFavorite}
            onLike={handleLike}
            onShowToast={showToast}
          />
        )}

        {/* ================= VIEW: HOME SCREEN ================= */}
        {/* The Home Screen contains ONLY the header and the 4-column poet-name button grid. */}
        {/* There is NO poetry, ghazal, shair, or poetry cards on the Home Screen! */}
        {currentView === 'home' && (
          <div id="home-screen-view" className="space-y-4 animate-in fade-in duration-200">
            {/* Admin-controlled Banner directly below the header */}
            <HomeBanner banner={activeBanner} />
            <PoetPillButtons
              poets={poets}
              onSelectPoet={handleSelectPoet}
              isLoading={isLoading}
            />
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-stone-200/60 py-6 text-center text-xs text-stone-600 font-sans-ui mt-auto">
        <p className="font-nastaliq text-sm text-stone-700">حرفِ قلم — تمام حقوق محفوظ ہیں</p>
      </footer>
    </div>
  );
}

