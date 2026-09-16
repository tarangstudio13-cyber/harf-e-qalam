import React from 'react';
import { Feather } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div
      id="splash-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fbf9f6] text-stone-900 select-none animate-in fade-in duration-300"
    >
      <div className="flex flex-col items-center gap-4 text-center px-6">
        {/* Minimal Premium Emblem matching the Header */}
        <div className="w-14 h-14 rounded-2xl bg-stone-900 text-amber-100 flex items-center justify-center shadow-md">
          <Feather className="w-7 h-7 text-amber-200/95" />
        </div>

        {/* App Name: exactly 'Harf-e-Qalam' using the same elegant font style as the Header */}
        <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-stone-900 font-sans-ui">
          Harf-e-Qalam
        </h1>
      </div>
    </div>
  );
};
