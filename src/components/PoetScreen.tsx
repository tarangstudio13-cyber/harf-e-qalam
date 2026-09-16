import React, { useState, useMemo, useEffect } from 'react';
import { Poet, Poetry, Category } from '../types.js';
import { PoetryCard } from './PoetryCard.js';
import { ArrowRight, Share2, Feather, BookOpen, ScrollText } from 'lucide-react';

interface PoetScreenProps {
  poet: Poet;
  poetryList: Poetry[];
  categories: Category[];
  favoriteIds: string[];
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  onLike: (id: string) => Promise<void>;
  onShowToast: (message: string) => void;
}

export type PoetCategoryTab = 'shair' | 'ghazal' | 'nazm' | 'kalam';

export const PoetScreen: React.FC<PoetScreenProps> = ({
  poet,
  poetryList,
  categories,
  favoriteIds,
  onBack,
  onToggleFavorite,
  onLike,
  onShowToast,
}) => {
  // Find all poetry belonging to this poet
  const poetAllPoetry = useMemo(() => {
    return poetryList.filter((p) => {
      if (p.poetId && p.poetId === poet.id) return true;
      if (p.poetNameUrdu && p.poetNameUrdu.trim() === poet.nameUrdu.trim()) return true;
      if (
        poet.nameEnglish &&
        p.poetNameEnglish &&
        p.poetNameEnglish.toLowerCase().trim() === poet.nameEnglish.toLowerCase().trim()
      ) {
        return true;
      }
      return false;
    });
  }, [poetryList, poet]);

  // Counts for each of the 4 requested categories: شعر | غزل | نظم | کلام
  const counts = useMemo(() => {
    let shair = 0;
    let ghazal = 0;
    let nazm = 0;

    poetAllPoetry.forEach((p) => {
      const type = p.poetryType || (p.versesUrdu.length > 2 ? 'ghazal' : 'ashar');
      if (type === 'ghazal') {
        ghazal++;
      } else if (type === 'nazm') {
        nazm++;
      } else {
        shair++;
      }
    });

    return {
      shair,
      ghazal,
      nazm,
      kalam: poetAllPoetry.length,
    };
  }, [poetAllPoetry]);

  // Selected Category Tab: 'shair' | 'ghazal' | 'nazm' | 'kalam'
  const [selectedCategory, setSelectedCategory] = useState<PoetCategoryTab>('ghazal');

  // Select a populated tab if ghazal is empty on initial load
  useEffect(() => {
    if (counts.ghazal > 0) {
      setSelectedCategory('ghazal');
    } else if (counts.shair > 0) {
      setSelectedCategory('shair');
    } else if (counts.nazm > 0) {
      setSelectedCategory('nazm');
    } else {
      setSelectedCategory('kalam');
    }
  }, [poet.id, counts.ghazal, counts.shair, counts.nazm]);

  // Filter content based on user's selected category option
  const filteredContent = useMemo(() => {
    if (selectedCategory === 'shair') {
      return poetAllPoetry.filter((p) => {
        const type = p.poetryType || (p.versesUrdu.length > 2 ? 'ghazal' : 'ashar');
        return type === 'ashar';
      });
    }

    if (selectedCategory === 'ghazal') {
      return poetAllPoetry.filter((p) => {
        const type = p.poetryType || (p.versesUrdu.length > 2 ? 'ghazal' : 'ashar');
        return type === 'ghazal';
      });
    }

    if (selectedCategory === 'nazm') {
      return poetAllPoetry.filter((p) => p.poetryType === 'nazm');
    }

    // 'kalam': Show complete poetry collection of this poet
    return poetAllPoetry;
  }, [poetAllPoetry, selectedCategory]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Share poet profile
  const handleSharePoet = async () => {
    const text = `${poet.nameUrdu} (${poet.nameEnglish || ''}) کا منتخب کلام حرفِ قلم ایپ پر پڑھیں`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `حرفِ قلم - ${poet.nameUrdu}`,
          text,
        });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      onShowToast('شاعر کا لنک کاپی ہو گیا');
    }
  };

  return (
    <div id="poet-screen-view" className="w-full max-w-3xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Top App Bar with Android-style Back Arrow, Poet Name, and Share */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs sticky top-3 z-30 flex items-center justify-between gap-3">
        {/* Back Button */}
        <button
          id="poet-screen-back-btn"
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors active:scale-95 cursor-pointer font-sans-ui text-sm font-medium"
          title="واپس شعراء کی فہرست میں جائیں (Back to Poets)"
        >
          <ArrowRight className="w-5 h-5 text-stone-600" />
          <span className="font-nastaliq text-base">واپس</span>
        </button>

        {/* Poet Name Center */}
        <div className="text-center flex-1 px-2">
          <h1 className="font-nastaliq text-2xl sm:text-3xl text-stone-900 font-bold leading-tight">
            {poet.nameUrdu}
          </h1>
          {poet.nameEnglish && (
            <p className="text-[11px] text-stone-500 font-sans-ui tracking-wide">
              {poet.nameEnglish} {poet.titleOrEra ? `• ${poet.titleOrEra}` : ''}
            </p>
          )}
        </div>

        {/* Share Button */}
        <button
          id="poet-screen-share-btn"
          type="button"
          onClick={handleSharePoet}
          className="p-2.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors active:scale-95 cursor-pointer"
          title="شاعر کا کلام شیئر کریں (Share)"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Category Options: شعر | غزل | نظم | کلام */}
      <div
        id="poet-category-options-bar"
        className="bg-white rounded-2xl border border-stone-200/80 p-1.5 sm:p-2 shadow-2xs"
      >
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          {/* شعر (Shair / Ash'ar) */}
          <button
            id="option-tab-shair"
            type="button"
            onClick={() => setSelectedCategory('shair')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl transition-all cursor-pointer select-none active:scale-[0.98] ${
              selectedCategory === 'shair'
                ? 'bg-stone-900 text-amber-50 shadow-xs'
                : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/80'
            }`}
          >
            <span className="font-nastaliq text-base sm:text-lg leading-[2.1]">
              شعر
            </span>
            <span
              className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-sans-ui font-medium ${
                selectedCategory === 'shair'
                  ? 'bg-stone-800 text-amber-200'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {counts.shair}
            </span>
          </button>

          {/* غزل (Ghazal) */}
          <button
            id="option-tab-ghazal"
            type="button"
            onClick={() => setSelectedCategory('ghazal')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl transition-all cursor-pointer select-none active:scale-[0.98] ${
              selectedCategory === 'ghazal'
                ? 'bg-stone-900 text-amber-50 shadow-xs'
                : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/80'
            }`}
          >
            <span className="font-nastaliq text-base sm:text-lg leading-[2.1]">
              غزل
            </span>
            <span
              className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-sans-ui font-medium ${
                selectedCategory === 'ghazal'
                  ? 'bg-stone-800 text-amber-200'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {counts.ghazal}
            </span>
          </button>

          {/* نظم (Nazm) */}
          <button
            id="option-tab-nazm"
            type="button"
            onClick={() => setSelectedCategory('nazm')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl transition-all cursor-pointer select-none active:scale-[0.98] ${
              selectedCategory === 'nazm'
                ? 'bg-stone-900 text-amber-50 shadow-xs'
                : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/80'
            }`}
          >
            <span className="font-nastaliq text-base sm:text-lg leading-[2.1]">
              نظم
            </span>
            <span
              className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-sans-ui font-medium ${
                selectedCategory === 'nazm'
                  ? 'bg-stone-800 text-amber-200'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {counts.nazm}
            </span>
          </button>

          {/* کلام (Kalam / Full Collection) */}
          <button
            id="option-tab-kalam"
            type="button"
            onClick={() => setSelectedCategory('kalam')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl transition-all cursor-pointer select-none active:scale-[0.98] ${
              selectedCategory === 'kalam'
                ? 'bg-stone-900 text-amber-50 shadow-xs'
                : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/80'
            }`}
          >
            <span className="font-nastaliq text-base sm:text-lg leading-[2.1]">
              کلام
            </span>
            <span
              className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-sans-ui font-medium ${
                selectedCategory === 'kalam'
                  ? 'bg-stone-800 text-amber-200'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {counts.kalam}
            </span>
          </button>
        </div>
      </div>

      {/* Clean Category Label & Count */}
      <div className="flex items-center justify-between px-2 pt-0.5">
        <div className="flex items-center gap-2">
          <h2 className="font-nastaliq text-lg sm:text-xl text-stone-800 font-semibold">
            {selectedCategory === 'shair'
              ? 'اشعار'
              : selectedCategory === 'ghazal'
              ? 'غزلیات'
              : selectedCategory === 'nazm'
              ? 'منظومات (نظمیں)'
              : 'تمام کلام'}
          </h2>
          <span className="text-xs font-sans-ui text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full font-medium">
            {filteredContent.length} {filteredContent.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* Content List: Relevant poetry of this poet */}
      <div id="poet-poetry-list" className="space-y-4">
        {filteredContent.map((poetry) => (
          <PoetryCard
            key={poetry.id}
            poetry={poetry}
            category={categoryMap.get(poetry.categoryId)}
            isFavorite={favoriteIds.includes(poetry.id)}
            onToggleFavorite={onToggleFavorite}
            onLike={onLike}
            onShowToast={onShowToast}
            verseClassName="font-nastaliq text-[17px] sm:text-lg md:text-[19px] text-stone-850 tracking-normal leading-[2.3] sm:leading-[2.4] select-text"
          />
        ))}

        {/* Clean Empty State if no poetry exists for this category */}
        {filteredContent.length === 0 && (
          <div
            id="poet-empty-category-state"
            className="bg-white rounded-2xl border border-stone-200/80 p-8 sm:p-10 text-center space-y-3 shadow-2xs"
          >
            <div className="w-11 h-11 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
              <ScrollText className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-nastaliq text-lg text-stone-800 font-medium">
                اس زمرے میں فی الحال کوئی کلام موجود نہیں
              </p>
              <p className="text-xs text-stone-500 font-sans-ui">
                No entries available in this category for {poet.nameUrdu}.
              </p>
            </div>
            {selectedCategory !== 'kalam' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('kalam')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-amber-50 rounded-xl text-xs font-nastaliq hover:bg-stone-800 transition-colors cursor-pointer"
              >
                تمام کلام دیکھیں
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

