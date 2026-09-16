import React from 'react';
import { Category } from '../types.js';

interface CategoryChipsProps {
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  isLoading?: boolean;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  isLoading = false,
}) => {
  if (isLoading && categories.length === 0) {
    return (
      <div id="category-chips-loading" className="flex items-center gap-2 overflow-hidden py-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 w-24 bg-stone-200/70 animate-pulse rounded-full shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <div id="category-chips-section" className="relative">
      <div
        id="category-chips-scroll-container"
        className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {/* "All" Category Chip */}
        <button
          id="cat-chip-all"
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`group flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium shrink-0 transition-all duration-150 cursor-pointer select-none ${
            activeCategoryId === null
              ? 'bg-stone-900 text-amber-50 shadow-xs ring-1 ring-stone-900'
              : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 border border-stone-200/80 shadow-2xs'
          }`}
        >
          <span className="font-nastaliq text-sm leading-none mt-0.5">تمام کلام</span>
          <span className="text-[11px] opacity-60 font-sans-ui">(All)</span>
        </button>

        {/* Dynamic Categories loaded from DB */}
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          return (
            <button
              id={`cat-chip-${cat.id}`}
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`group flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium shrink-0 transition-all duration-150 cursor-pointer select-none ${
                isActive
                  ? 'bg-stone-900 text-amber-50 shadow-xs ring-1 ring-stone-900'
                  : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 border border-stone-200/80 shadow-2xs'
              }`}
            >
              <span className="font-nastaliq text-sm leading-none mt-0.5">
                {cat.nameUrdu}
              </span>
              {cat.nameEnglish && (
                <span
                  className={`text-[10px] tracking-tight font-sans-ui ${
                    isActive ? 'text-amber-200/80' : 'text-stone-400 group-hover:text-stone-500'
                  }`}
                >
                  {cat.nameEnglish}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
