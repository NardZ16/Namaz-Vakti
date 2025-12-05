import React, { useEffect, useState } from 'react';
import { NextPrayerInfo } from '../types';

interface CountdownTimerProps {
  nextPrayer: NextPrayerInfo | null;
  onExpire?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ nextPrayer, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  
  useEffect(() => {
    if (!nextPrayer) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = nextPrayer.prayerTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(interval);
        // Trigger parent update (wait 1s to ensure time has officially passed)
        if (onExpire) {
            setTimeout(() => {
                onExpire();
            }, 1000);
        }
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextPrayer, onExpire]);

  if (!nextPrayer) {
    return (
      <div className="w-full h-64 rounded-t-[10rem] rounded-b-3xl bg-gray-200 dark:bg-slate-800 animate-pulse flex items-center justify-center border-4 border-white dark:border-slate-700">
        <span className="text-gray-400 dark:text-gray-500 font-sans font-medium">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full shadow-2xl overflow-hidden group">
      {/* Arch Shape Container */}
      <div className="relative bg-gradient-to-b from-teal-700 via-teal-800 to-teal-900 dark:from-[#0f2e2e] dark:via-[#091f1f] dark:to-[#050f0f] rounded-t-[10rem] rounded-b-3xl p-8 pt-12 text-center border-[6px] border-double border-[#d4af37] dark:border-amber-700/50 shadow-[0_10px_30px_-5px_rgba(15,118,110,0.5)]">
        
        {/* Decorative Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
        
        {/* Inner Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-teal-400/20 blur-3xl rounded-full"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
            
            <div className="flex items-center gap-3 mb-2 opacity-90">
                <span className="h-px w-8 bg-amber-400/50"></span>
                <span className="text-amber-300 font-serif font-medium text-xs md:text-sm tracking-[0.2em] uppercase">Vaktin Çıkmasına</span>
                <span className="h-px w-8 bg-amber-400/50"></span>
            </div>

            <div className="font-cinzel text-6xl md:text-7xl font-bold text-white tracking-wider tabular-nums drop-shadow-md">
                {timeLeft}
            </div>

            <div className="mt-4 flex flex-col items-center">
                 <div className="bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
                    <span className="text-amber-300 font-sans font-medium text-lg mr-2">Sonraki:</span>
                    <span className="text-white font-bold text-lg tracking-wide">{nextPrayer.prayerName}</span>
                 </div>
                 <div className="mt-2 text-teal-200/80 text-sm font-medium font-sans">
                    {nextPrayer.isTomorrow ? "Yarın" : "Bugün"} {nextPrayer.prayerTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                 </div>
            </div>
        </div>
      </div>

      {/* Hanging Lamp Decoration (Visual CSS only) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-12 bg-amber-500/50 z-20"></div>
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_15px_#fbbf24] z-20 animate-pulse"></div>

    </div>
  );
};

export default CountdownTimer;