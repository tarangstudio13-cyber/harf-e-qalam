import React from 'react';
import { Banner } from '../types.js';

interface HomeBannerProps {
  banner: Banner | null;
}

export const HomeBanner: React.FC<HomeBannerProps> = ({ banner }) => {
  // If there is no active banner or banner image is empty, hide completely with zero empty space
  if (!banner || !banner.isActive || !banner.imageUrl) {
    return null;
  }

  const content = (
    <div
      id="home-admin-banner"
      className="w-full rounded-2xl overflow-hidden shadow-xs border border-stone-200/90 relative bg-stone-900 group select-none transition-all duration-300"
    >
      <div className="aspect-[16/7] sm:aspect-[21/8] md:aspect-[3/1] max-h-[220px] min-h-[130px] sm:min-h-[160px] w-full relative flex items-end overflow-hidden">
        {/* Banner Image */}
        <img
          src={banner.imageUrl}
          alt={banner.title || 'Urdu Poetry Banner'}
          className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-102"
          loading="eager"
        />

        {/* Gradient Contrast Overlay for Text Readability */}
        {(banner.title || banner.subtitle) && (
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-stone-950/10 pointer-events-none" />
        )}

        {/* Text Details (Only rendered if title or subtitle specified by admin) */}
        {(banner.title || banner.subtitle) && (
          <div className="relative z-10 p-4 sm:p-5 md:p-6 text-right w-full">
            {banner.title && (
              <h2 className="font-nastaliq text-lg sm:text-2xl md:text-3xl text-amber-100 font-bold leading-snug drop-shadow-sm">
                {banner.title}
              </h2>
            )}
            {banner.subtitle && (
              <p className="font-nastaliq text-xs sm:text-sm md:text-base text-stone-200/95 mt-1 leading-relaxed max-w-2xl drop-shadow-xs">
                {banner.subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (banner.linkUrl && banner.linkUrl.trim()) {
    const isExternal = banner.linkUrl.startsWith('http');
    return (
      <a
        href={banner.linkUrl}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="block focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 rounded-2xl"
      >
        {content}
      </a>
    );
  }

  return content;
};
