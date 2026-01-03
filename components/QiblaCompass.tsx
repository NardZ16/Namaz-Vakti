
import React, { useState, useEffect, useRef } from 'react';
import { triggerHaptic } from '../services/nativeService';

interface QiblaCompassProps {
  latitude: number;
  longitude: number;
}

// Helper: Linear Interpolation for smoothing
const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor;
};

// Calculate shortest rotation direction
const shortestAngleDist = (from: number, to: number) => {
    let diff = (to - from + 360) % 360;
    if (diff > 180) diff -= 360;
    return diff;
};

const DetailedRugIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg 
    viewBox="0 0 300 500" 
    className={className} 
    style={style}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g stroke="currentColor" strokeWidth="3" opacity="0.6">
       {[...Array(14)].map((_, i) => <line key={`b-${i}`} x1={20 + i*20} y1="480" x2={20 + i*20} y2="500" />)}
    </g>
    <g stroke="currentColor" strokeWidth="3" opacity="0.6">
       {[...Array(14)].map((_, i) => <line key={`t-${i}`} x1={20 + i*20} y1="20" x2={20 + i*20} y2="0" />)}
    </g>
    <rect x="20" y="20" width="260" height="460" rx="8" fill="currentColor" fillOpacity="0.85" />
    <rect x="35" y="35" width="230" height="430" rx="4" stroke="white" strokeOpacity="0.3" strokeWidth="2" fill="none" />
    <path d="M50 440 V160 Q150 50 250 160 V440 H50 Z" fill="white" fillOpacity="0.15" />
    <path d="M150 60 L150 90" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
    <circle cx="150" cy="95" r="4" fill="white" fillOpacity="0.4" />
    <g transform="translate(150, 240)">
       <path d="M0 -40 L40 0 L0 40 L-40 0 Z" fill="white" fillOpacity="0.2" />
       <circle cx="0" cy="0" r="15" fill="currentColor" fillOpacity="0.8" stroke="white" strokeOpacity="0.3" strokeWidth="2"/>
       <circle cx="0" cy="0" r="4" fill="white" fillOpacity="0.6" />
    </g>
    <path d="M50 400 L250 400" stroke="white" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="5 5" />
    <path d="M50 415 L250 415" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
  </svg>
);

const QiblaCompass: React.FC<QiblaCompassProps> = ({ latitude, longitude }) => {
  const [heading, setHeading] = useState<number>(0);
  const [smoothHeading, setSmoothHeading] = useState<number>(0); // New smoothed state
  const [qiblaAngle, setQiblaAngle] = useState<number>(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isAligned, setIsAligned] = useState<boolean>(false);
  
  const wasAlignedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const PI = Math.PI;
    const lat1 = latitude * (PI / 180);
    const long1 = longitude * (PI / 180);
    const lat2 = 21.422487 * (PI / 180); // Kaaba Lat
    const long2 = 39.826206 * (PI / 180); // Kaaba Long

    let y = Math.sin(long2 - long1);
    let x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(long2 - long1);
    let qibla = Math.atan2(y, x) * (180 / PI);
    
    setQiblaAngle((qibla + 360) % 360);
  }, [latitude, longitude]);

  // SMOOTHING LOOP
  useEffect(() => {
    const updateSmoothHeading = () => {
        setSmoothHeading(prev => {
            const diff = shortestAngleDist(prev, heading);
            // Lerp factor 0.1 for smooth, 0.2 for faster
            const newHeading = prev + diff * 0.1; 
            return newHeading;
        });
        animationFrameRef.current = requestAnimationFrame(updateSmoothHeading);
    };
    updateSmoothHeading();
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [heading]);

  useEffect(() => {
    // Check alignment using smoothed value
    const normalizedHeading = (smoothHeading + 360) % 360;
    let diff = Math.abs(qiblaAngle - normalizedHeading);
    if (diff > 180) diff = 360 - diff;

    const aligned = diff < 5;

    if (aligned && !wasAlignedRef.current) {
        triggerHaptic('success');
    }

    wasAlignedRef.current = aligned;
    setIsAligned(aligned);
  }, [smoothHeading, qiblaAngle]);

  const handleOrientation = (event: DeviceOrientationEvent) => {
    let compass = 0;
    // iOS (WebKit) has specific property
    if ((event as any).webkitCompassHeading) {
      compass = (event as any).webkitCompassHeading;
    } else if (event.alpha !== null) {
       // Android/Non-Webkit
       compass = Math.abs(360 - event.alpha);
    }
    setHeading(compass);
  };

  const requestAccess = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          alert('Pusula için izin gerekli.');
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      setPermissionGranted(true);
      window.addEventListener('deviceorientation', handleOrientation);
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
        setIsSupported(false);
    }
  }, []);

  // Use smoothed heading for rotation
  const userRugRotation = ((smoothHeading - qiblaAngle) + 360) % 360;

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 pb-24 bg-[#f5f2eb] dark:bg-[#0c1218] relative overflow-hidden">
      
      {isAligned && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-700 animate-in fade-in"
        >
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1537562649149-9f44e6e5e64e?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
           <div className="relative z-10 flex flex-col items-center animate-pulse">
              <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.8)] mb-6 border-4 border-white">
                   <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h1 className="text-4xl font-black text-white tracking-wider drop-shadow-lg text-center">KIBLE<br/>BULUNDU</h1>
              <p className="text-emerald-300 mt-2 font-medium tracking-widest text-sm border-t border-emerald-500/50 pt-2">ALLAH KABUL ETSİN</p>
           </div>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-8 absolute top-4 left-4 z-10">Kıble Pusulası</h2>

      {!isSupported ? (
         <div className="text-center z-10 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
             <p className="text-gray-600 dark:text-gray-300 font-bold">Cihazınızda pusula sensörü bulunamadı.</p>
         </div>
      ) : !permissionGranted ? (
        <div className="text-center z-10">
          <p className="mb-4 text-gray-600 dark:text-gray-300">Pusulayı kullanmak için sensör erişimine izin verin.</p>
          <button 
            onClick={requestAccess} 
            className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
          >
            Pusulayı Başlat
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative w-80 h-[30rem] z-10 flex items-center justify-center">
            {/* Fixed Background Rug (Target) */}
            <div className="absolute w-52 h-[22rem] text-gray-400 dark:text-slate-700 flex flex-col items-center justify-center">
                <DetailedRugIcon className="w-full h-full drop-shadow-sm opacity-50" />
                <div className="absolute top-[40%] text-[10px] font-bold tracking-[0.2em] text-gray-500 dark:text-slate-600 uppercase opacity-70">
                    Kıble Yönü
                </div>
            </div>

            {/* Rotating User Rug */}
            <div 
                className={`absolute w-52 h-[22rem] origin-center will-change-transform ${isAligned ? 'text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'text-emerald-600 dark:text-emerald-500 opacity-90'}`}
                style={{ transform: `rotate(${userRugRotation}deg)` }}
            >
                <DetailedRugIcon className="w-full h-full" />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-emerald-600 dark:text-emerald-400">
                    {isAligned ? (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                    ) : (
                        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    )}
                </div>
            </div>

            <div className={`absolute bottom-0 w-full text-center font-mono transition-colors duration-300 ${isAligned ? 'text-emerald-500 font-bold scale-110' : 'text-gray-500 dark:text-gray-400'}`}>
                {isAligned ? 'HİZALANDI' : 'Seccadeleri Üst Üste Getirin'}
            </div>
            
             <div className="absolute -bottom-8 w-full text-center text-[10px] text-gray-400 font-mono opacity-60">
               Derece: {((360 - userRugRotation) % 360).toFixed(0)}°
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QiblaCompass;
