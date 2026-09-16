import React, { useMemo } from 'react';
import { Poetry, Category } from '../types.js';
import { PoetryCard } from './PoetryCard.js';
import { ArrowRight, Bookmark, Sparkles } from 'lucide-react';

interface FavoritesScreenProps {
  favoriteIds: string[];
  poetryList: Poetry[];
  categories: Category[];
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  onLike: (id: string) => Promise<void>;
  onShowToast: (message: string) => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  favoriteIds,
  poetryList,
  categories,
  onBack,
  onToggleFavorite,
  onLike,
  onShowToast,
}) => {
  const favoritePoems = useMemo(() => {
    return poetryList.filter((p) => favoriteIds.includes(p.id));
  }, [poetryList, favoriteIds]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  return (
    <div id="favorites-screen-view" className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top App Bar with Android-style Back Arrow */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs sticky top-3 z-30 flex items-center justify-between gap-3">
        <button
          id="favorites-screen-back-btn"
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors active:scale-95 cursor-pointer font-sans-ui text-sm font-medium"
          title="واپس جائیں (Back)"
        >
          <ArrowRight className="w-5 h-5 text-stone-600" />
          <span className="font-nastaliq text-base">واپس</span>
        </button>

        <div className="text-center flex-1 px-2">
          <div className="flex items-center justify-center gap-1.5">
            <Bookmark className="w-4 h-4 fill-amber-500 text-amber-600" />
            <h1 className="font-nastaliq text-xl sm:text-2xl text-stone-900 font-bold leading-tight">
              پسندیدہ کلام
            </h1>
          </div>
          <p className="text-[11px] text-stone-500 font-sans-ui">
            Saved Poetry Collection ({favoritePoems.length})
          </p>
        </div>

        <div className="w-16" />
      </div>

      {/* Favorites List or Empty State */}
      {favoritePoems.length === 0 ? (
        <div
          id="favorites-empty-state"
          className="bg-white rounded-3xl border border-stone-200/80 p-8 sm:p-14 text-center space-y-4 shadow-xs"
        >
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <p className="font-nastaliq text-2xl text-stone-800">
              ابھی تک کوئی کلام پسندیدہ نہیں کیا گیا
            </p>
            <p className="text-xs text-stone-500 font-sans-ui">
              کسی بھی شعر پر بُک مارک آئیکن دبا کر محفوظ کریں۔
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-amber-50 rounded-full text-xs font-nastaliq hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
          >
            شعراء کی فہرست دیکھیں
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {favoritePoems.map((item) => (
            <PoetryCard
              key={item.id}
              poetry={item}
              category={categoryMap.get(item.categoryId)}
              isFavorite={true}
              onToggleFavorite={onToggleFavorite}
              onLike={onLike}
              onShowToast={onShowToast}
            />
          ))}
        </div>
      )}
    </div>
  );
};
