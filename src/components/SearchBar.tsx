import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'شاعر یا کلام کا شعر تلاش کریں...',
}) => {
  return (
    <div id="search-bar-wrapper" className="relative w-full">
      <div className="relative flex items-center">
        {/* Search Icon (RTL friendly - on the right in RTL) */}
        <div className="absolute right-3.5 pointer-events-none text-stone-400">
          <Search className="w-4 h-4" />
        </div>

        {/* Input */}
        <input
          id="poetry-search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir="rtl"
          className="w-full pr-10 pl-10 py-2.5 bg-white border border-stone-200/90 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-400/15 transition-all shadow-xs"
        />

        {/* Clear Button */}
        {value && (
          <button
            id="clear-search-btn"
            type="button"
            onClick={() => onChange('')}
            className="absolute left-3 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="تلاش ختم کریں"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
