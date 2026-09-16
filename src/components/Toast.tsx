import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      id="app-toast-feedback"
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div className="bg-stone-900/95 text-amber-50 px-4 py-2.5 rounded-full shadow-lg border border-stone-700/80 backdrop-blur-md flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
        <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
        <span className="font-nastaliq text-sm leading-none mt-0.5">{message}</span>
      </div>
    </div>
  );
};
