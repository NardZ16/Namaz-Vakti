
import React, { useEffect, useState } from 'react';
import { isNative } from '../services/nativeService';

interface GoogleAdProps {
  slotId?: string;
  className?: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | null;
}

const GoogleAd: React.FC<GoogleAdProps> = ({ slotId, className, style, format = 'auto' }) => {
  const [isMobileApp, setIsMobileApp] = useState(false);

  // Bottom Ad Slot ID (This is handled by Native AdMob Overlay on mobile)
  const BOTTOM_SLOT_ID = "2441755104";

  useEffect(() => {
    const native = isNative();
    setIsMobileApp(native);

    if (!native) {
        // Web Mode: Push AdSense
        const timer = setTimeout(() => {
            try {
                const adsbygoogle = (window as any).adsbygoogle || [];
                adsbygoogle.push({});
            } catch (e) {
                console.error("AdSense error (AdBlock might be active):", e);
            }
        }, 500);
        return () => clearTimeout(timer);
    }
  }, []);

  const CLIENT_ID = "ca-pub-4319080566007267"; 

  // Native Mode Logic
  if (isMobileApp) {
      // If it's the bottom slot, render nothing (Native Overlay handles it)
      if (slotId === BOTTOM_SLOT_ID) {
          return null;
      }

      // If it's an inline slot (Navbar or Timer), render a beautiful Placeholder Card.
      // Since standard AdMob Banners are Sticky/Overlay and cannot scroll with content easily,
      // we fill this space with useful content or a "House Ad" look to keep layout consistency.
      return (
        <div className={`relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 border border-teal-100 dark:border-slate-600 shadow-sm ${className}`} style={style}>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
            <div className="relative z-10 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-lg shadow-sm">
                        <svg className="w-5 h-5 text-teal-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-teal-800 dark:text-emerald-400 tracking-wider">Günün Hadisi</span>
                        <span className="text-xs font-serif text-gray-700 dark:text-gray-200 italic">"Ameller niyetlere göredir."</span>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // Web Mode: Show AdSense (or placeholder if ID is missing/test)
  if (!slotId || CLIENT_ID.includes('XXX')) {
      return (
        <div className={`flex justify-center items-center overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${className}`} style={style}>
            <div className="flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 p-2">
                <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Google Ads</span>
            </div>
        </div>
      );
  }

  return (
    <div className={`relative overflow-hidden flex justify-center items-center ${className}`} style={style}>
       <ins className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '100%' }}
            data-ad-client={CLIENT_ID}
            data-ad-slot={slotId}
            data-ad-format={format === null ? undefined : format}
            data-full-width-responsive={format === 'auto' || format === 'horizontal' ? "true" : "false"}></ins>
    </div>
  );
};

export default GoogleAd;
