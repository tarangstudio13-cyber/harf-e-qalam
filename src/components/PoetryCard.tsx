import React, { useState } from 'react';
import { Heart, Copy, Check, Share2, Bookmark, Feather } from 'lucide-react';
import { Poetry, Category } from '../types.js';

interface PoetryCardProps {
  poetry: Poetry;
  category?: Category;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onLike: (id: string) => Promise<void>;
  onShowToast: (message: string) => void;
  verseClassName?: string;
}

export const PoetryCard: React.FC<PoetryCardProps> = ({
  poetry,
  category,
  isFavorite,
  onToggleFavorite,
  onLike,
  onShowToast,
  verseClassName,
}) => {
  const [copied, setCopied] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likesCount, setLikesCount] = useState(poetry.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(false);

  // Copy poetry with poet name
  const handleCopy = async () => {
    try {
      const textToCopy = `${poetry.versesUrdu.join('\n')}\n\n— ${poetry.poetNameUrdu} (${poetry.poetNameEnglish || ''})`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      onShowToast('کلام کاپی ہو گیا (Poetry copied to clipboard)');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      onShowToast('کاپی کرنے میں خرابی ہوئی');
    }
  };

  // Share poetry
  const handleShare = async () => {
    const textToShare = `${poetry.versesUrdu.join('\n')}\n\n— ${poetry.poetNameUrdu}\n\nHarf-e-Qalam (حرفِ قلم)`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Harf-e-Qalam - ${poetry.poetNameUrdu}`,
          text: textToShare,
        });
      } catch (err) {
        // User cancelled share or failed
      }
    } else {
      handleCopy();
    }
  };

  // Like poetry
  const handleLikeClick = async () => {
    if (hasLiked || isLiking) return;
    setIsLiking(true);
    setHasLiked(true);
    setLikesCount((prev) => prev + 1);
    try {
      await onLike(poetry.id);
    } catch (err) {
      // Revert if failed
      setHasLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <article
      id={`poetry-card-${poetry.id}`}
      className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-200 p-6 sm:p-8 flex flex-col relative group"
    >
      {/* Card Header: Poet Name & Category Tag */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100/80 mb-4">
        {/* Poet Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 border border-stone-200/60">
            <Feather className="w-3.5 h-3.5 text-stone-500" />
          </div>
          <div>
            <h3 className="font-nastaliq text-base sm:text-lg text-stone-900 leading-tight">
              {poetry.poetNameUrdu}
            </h3>
            {poetry.poetNameEnglish && (
              <span className="text-[11px] text-stone-400 font-sans-ui block tracking-tight">
                {poetry.poetNameEnglish}
              </span>
            )}
          </div>
        </div>

        {/* Category Badge & Bookmark */}
        <div className="flex items-center gap-2">
          {category && (
            <span
              className="px-2.5 py-1 rounded-full text-xs bg-stone-100/90 text-stone-600 font-nastaliq border border-stone-200/50"
              title={category.nameEnglish}
            >
              {category.nameUrdu}
            </span>
          )}
          <button
            id={`bookmark-btn-${poetry.id}`}
            type="button"
            onClick={() => onToggleFavorite(poetry.id)}
            className={`p-1.5 rounded-full transition-colors ${
              isFavorite
                ? 'text-amber-600 bg-amber-50'
                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50'
            }`}
            title={isFavorite ? 'پسندیدہ سے ہٹائیں' : 'پسندیدہ میں شامل کریں'}
          >
            <Bookmark
              className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-600' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Card Center: Urdu Poetry Verses */}
      <div className="py-4 sm:py-5 px-2 flex flex-col items-center justify-center text-center">
        <div className="space-y-2 sm:space-y-2.5 max-w-xl mx-auto w-full">
          {poetry.versesUrdu.map((verse, idx) => (
            <p
              key={idx}
              dir="rtl"
              className={
                verseClassName ||
                "font-nastaliq text-[17px] sm:text-lg md:text-[19px] text-stone-850 tracking-normal leading-[2.3] sm:leading-[2.4] select-text"
              }
            >
              {verse}
            </p>
          ))}
        </div>

        {/* Delicate Classical Ornament */}
        <div className="mt-4 flex items-center justify-center gap-2 text-stone-300 select-none">
          <span className="w-7 h-[1px] bg-stone-200"></span>
          <span className="text-[10px] font-serif opacity-70">✦</span>
          <span className="w-7 h-[1px] bg-stone-200"></span>
        </div>
      </div>

      {/* Card Footer: Minimal Elegant Actions */}
      <div className="pt-4 border-t border-stone-100 flex items-center justify-between mt-auto">
        {/* Like Button */}
        <button
          id={`like-btn-${poetry.id}`}
          type="button"
          onClick={handleLikeClick}
          disabled={hasLiked}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            hasLiked
              ? 'text-rose-600 bg-rose-50/80 cursor-default'
              : 'text-stone-500 hover:text-rose-600 hover:bg-stone-50'
          }`}
          title="پسند کریں (Like)"
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              hasLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'group-hover:scale-105'
            }`}
          />
          <span className="font-sans-ui font-medium">{likesCount}</span>
        </button>

        {/* Action Buttons: Copy & Share */}
        <div className="flex items-center gap-1">
          <button
            id={`copy-btn-${poetry.id}`}
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              copied
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
            }`}
            title="کاپی کریں (Copy)"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-nastaliq text-xs">کاپی ہوا</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-sans-ui text-xs">Copy</span>
              </>
            )}
          </button>

          <button
            id={`share-btn-${poetry.id}`}
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors"
            title="شیئر کریں (Share)"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="font-sans-ui text-xs">Share</span>
          </button>
        </div>
      </div>
    </article>
  );
};
