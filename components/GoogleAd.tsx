
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

    // Logic:
    // 1. If Web: Always push ads.
    // 2. If Native: Only push ads if it's NOT the bottom slot (because bottom is handled by AdMob Overlay).
    //    This allows the Top Ad to render inside the WebView as an AdSense fallback (Hybrid approach).
    if (!native || (native && slotId !== BOTTOM_SLOT_ID)) {
        // Wrap in setTimeout to ensure the DOM element has rendered and has width
        // This fixes "No slot size for availableWidth=0" error
        const timer = setTimeout(() => {
            try {
                const adsbygoogle = (window as any).adsbygoogle || [];
                adsbygoogle.push({});
            } catch (e) {
                console.error("AdSense error (AdBlock might be active):", e);
            }
        }, 500); // 500ms delay to ensure layout paint

        return () => clearTimeout(timer);
    }
  }, [slotId]);

  // IMPORTANT: Replace this with your actual AdSense Publisher ID
  const CLIENT_ID = "ca-pub-4319080566007267"; 

  // On Native Mobile App:
  // If this is the BOTTOM ad, return null because we use the AdMob Plugin Overlay there.
  // If this is the TOP ad, we allow it to render (Webview AdSense) so it appears in the scroll view.
  if (isMobileApp && slotId === BOTTOM_SLOT_ID) {
      return null;
  }

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
    // Kapsayıcı Div: Kesinlikle overflow-hidden ve %100 yükseklik/genişlik
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