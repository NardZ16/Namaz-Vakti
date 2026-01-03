
import React, { useEffect, useState } from 'react';
import { isNative } from '../services/nativeService';

interface GoogleAdProps {
  slotId: string;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean; // Yeni: Daha az yer kaplaması için mod
}

const GoogleAd: React.FC<GoogleAdProps> = ({ slotId, className, style, compact = false }) => {
  const [isMobileApp, setIsMobileApp] = useState(false);

  useEffect(() => {
    setIsMobileApp(isNative());
  }, [slotId]);

  return (
    <div 
      className={`relative w-full overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-amber-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md ${compact ? 'py-2 px-3' : 'p-4'} ${className}`} 
      style={style}
    >
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
      
      <div className={`relative z-10 flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
        <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Sponsorlu</span>
        </div>

        <div className="flex items-center gap-3">
            {/* Native İkon Alanı - Compact modda küçülür */}
            <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} shrink-0 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-inner`}>
                <svg className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">Huzur Veren Dualar</h4>
                {!compact && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 leading-relaxed">
                     Günün her anında okuyabileceğiniz seçme dualar.
                  </p>
                )}
            </div>
            
            {/* Butonu yan tarafa aldık (Compact ise) */}
            {compact && (
              <button className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg shadow-sm">
                AÇ
              </button>
            )}
        </div>

        {!compact && (
          <button className="w-full py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-800/50">
              ŞİMDİ İNCELE
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleAd;
