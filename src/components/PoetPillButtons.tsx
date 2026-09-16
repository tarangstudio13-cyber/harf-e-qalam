import React, { useState, useMemo } from 'react';
import { Poet } from '../types.js';
import { Search, X } from 'lucide-react';
import { matchPoetBilingual } from '../utils/searchUtils.js';

interface PoetPillButtonsProps {
  poets: Poet[];
  onSelectPoet: (poet: Poet) => void;
  isLoading?: boolean;
}

export const PoetPillButtons: React.FC<PoetPillButtonsProps> = ({
  poets,
  onSelectPoet,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fast, bilingual search matching Urdu, English, and Roman transliterations
  const filteredPoets = useMemo(() => {
    if (!searchQuery.trim()) return poets;
    return poets.filter((p) => matchPoetBilingual(p, searchQuery));
  }, [poets, searchQuery]);

  // Check if current search input is in Latin/English for optimal cursor direction
  const isEnglishInput = /^[a-zA-Z0-9\s.,'"-_]+$/.test(searchQuery);

  if (isLoading && poets.length === 0) {
    return (
      <div id="poet-grid-loading" className="w-full space-y-4">
        {/* Loading Header skeleton */}
        <div className="h-10 bg-stone-200/60 rounded-xl animate-pulse w-full max-w-sm mx-auto" />
        {/* 4-column skeleton grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="h-[60px] sm:h-[68px] bg-white border border-stone-200/60 rounded-xl sm:rounded-2xl animate-pulse shadow-2xs"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="home-poets-section" className="w-full space-y-4">
      {/* Poets Header Bar: Title + Count + Search */}
      <div className="bg-white/95 rounded-2xl border border-stone-200/80 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Title & Badge */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-nastaliq text-xl sm:text-2xl text-stone-900 font-bold leading-normal">
              شعراءِ اردو
            </h2>
            <span className="text-[11px] font-sans-ui text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full font-semibold border border-stone-200/60">
              {filteredPoets.length} {filteredPoets.length === 1 ? 'شاعر' : 'شعراء'}
            </span>
          </div>

          <span className="text-xs text-stone-600 font-nastaliq hidden sm:inline">
            شاعر منتخب کر کے کلام پڑھیں
          </span>
        </div>

        {/* Bilingual Search Input */}
        <div className="relative w-full sm:w-80">
          <input
            id="poet-search-input"
            type="text"
            dir={isEnglishInput ? 'ltr' : 'rtl'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="شاعر تلاش کریں / Search poet (Ahmad Faraz, اقبال)..."
            className={`w-full py-2 bg-stone-50/90 hover:bg-stone-50 focus:bg-white border border-stone-200/90 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all font-nastaliq ${
              isEnglishInput ? 'pl-9 pr-8 text-left font-sans-ui' : 'pl-8 pr-9 text-right font-nastaliq'
            }`}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none ${
              isEnglishInput ? 'left-3' : 'right-3'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={`absolute top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer ${
                isEnglishInput ? 'right-2.5' : 'left-2.5'
              }`}
              title="تلاش صاف کریں (Clear search)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main 4-Column Poet-Name Button Grid */}
      {filteredPoets.length === 0 ? (
        <div
          id="poet-empty-search"
          className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center space-y-2 shadow-2xs"
        >
          <p className="font-nastaliq text-lg text-stone-800">
            اس نام سے کوئی شاعر نہیں ملا
          </p>
          <p className="text-xs text-stone-500 font-sans-ui">
            براہ کرم کوئی دوسرا نام تلاش کریں یا تلاش صاف کریں۔
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 px-4 py-1.5 bg-stone-900 text-amber-50 rounded-lg text-xs font-nastaliq hover:bg-stone-800 transition-colors cursor-pointer"
          >
            تمام شعراء دیکھیں
          </button>
        </div>
      ) : (
        <div
          id="poet-buttons-grid"
          className="grid grid-cols-4 gap-2 sm:gap-2.5 md:gap-3 w-full"
        >
          {filteredPoets.map((poet) => (
            <button
              key={poet.id}
              id={`poet-btn-${poet.id}`}
              type="button"
              onClick={() => onSelectPoet(poet)}
              className="group relative w-full h-[58px] min-[400px]:h-[64px] sm:h-[70px] md:h-[76px] bg-white hover:bg-stone-50/90 active:bg-amber-50/70 border border-stone-200/90 hover:border-stone-400 active:border-amber-400/80 rounded-xl sm:rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-xs transition-all duration-150 active:scale-[0.96] flex items-center justify-center text-center px-1 sm:px-2 py-1 cursor-pointer select-none overflow-hidden"
              title={`${poet.nameUrdu}${poet.nameEnglish ? ` (${poet.nameEnglish})` : ''}`}
            >
              {/* Only the Poet Name in elegant Nastaliq RTL typography */}
              <span className="font-nastaliq text-[12.5px] min-[380px]:text-[13.5px] sm:text-[15px] md:text-[16px] text-stone-800 group-hover:text-stone-950 font-medium leading-[1.65] text-center line-clamp-2 px-0.5 tracking-normal transition-colors">
                {poet.nameUrdu}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
