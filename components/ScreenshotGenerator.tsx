
import React, { useRef, useState } from 'react';

type ScreenshotSize = {
  label: string;
  width: number;
  height: number;
  id: '7inch' | '10inch';
};

const SIZES: ScreenshotSize[] = [
  { id: '7inch', label: '7" Tablet (1200x1920)', width: 1200, height: 1920 },
  { id: '10inch', label: '10" Tablet (1600x2560)', width: 1600, height: 2560 },
];

const FEATURES = [
  { title: "Namaz Vakitleri", sub: "Diyanet ile %100 Uyumlu Hassas Vakitler", icon: "🕌" },
  { title: "Kıble Pusulası", sub: "Dünyanın Her Yerinden Kabe Yönü", icon: "🧭" },
  { title: "Kuran-ı Kerim", sub: "Sesli Dinleme ve Türkçe Mealler", icon: "📖" },
  { title: "Zikirmatik", sub: "Dualarınızı ve Zikirlerinizi Takip Edin", icon: "📿" },
];

const ScreenshotGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSize, setSelectedSize] = useState<ScreenshotSize>(SIZES[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAndDownload = async (featureIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsGenerating(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = selectedSize;
    const feature = FEATURES[featureIndex];

    // 1. Arkaplan Gradyanı
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#115e59');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Arabesk Desen Overlay
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < width; i += 100) {
      for (let j = 0; j < height; j += 100) {
        ctx.strokeRect(i, j, 80, 80);
      }
    }
    ctx.globalAlpha = 1.0;

    // 3. Üst Metin Alanı
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${width * 0.08}px sans-serif`;
    ctx.fillText(feature.title, width / 2, height * 0.15);
    
    ctx.fillStyle = '#d4af37'; // Gold
    ctx.font = `${width * 0.04}px sans-serif`;
    ctx.fillText(feature.sub, width / 2, height * 0.20);

    // 4. Tablet Çerçevesi Çizimi (Mockup)
    const frameW = width * 0.85;
    const frameH = height * 0.65;
    const frameX = (width - frameW) / 2;
    const frameY = height * 0.28;

    // Dış Kasa
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, 40);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 10;
    ctx.stroke();

    // İç Ekran (App Mockup)
    const screenX = frameX + 20;
    const screenY = frameY + 60;
    const screenW = frameW - 40;
    const screenH = frameH - 120;

    ctx.fillStyle = '#f5f2eb';
    ctx.fillRect(screenX, screenY, screenW, screenH);

    // App Header Mockup
    ctx.fillStyle = '#115e59';
    ctx.fillRect(screenX, screenY, screenW, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("Namaz Vakti Pro", screenX + 40, screenY + 60);

    // App Content Mockup - Kartlar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(screenX + 40, screenY + 150, screenW - 80, 250, 20);
    ctx.fill();
    
    ctx.fillStyle = '#115e59';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(feature.icon + " " + feature.title, screenX + screenW/2, screenY + 280);

    // Alt Marka
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = `bold ${width * 0.03}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText("NAMAZ VAKTİ PRO - GOOGLE PLAY", width / 2, height - 80);

    // İndir
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tablet_screenshot_${selectedSize.id}_${featureIndex + 1}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setIsGenerating(false);
    }, 'image/png');
  };

  return (
    <div className="p-6 flex flex-col items-center space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-teal-100 dark:border-slate-700 w-full max-w-md">
        <h3 className="text-xl font-bold text-teal-900 dark:text-amber-500 mb-2">Tablet Ekran Görüntüsü Hazırla</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Google Play Console'un tabletler için istediği özel boyutlardaki tanıtım görsellerini hazırlayın.
        </p>

        <div className="flex gap-2 mb-6">
          {SIZES.map(size => (
            <button
              key={size.id}
              onClick={() => setSelectedSize(size)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                selectedSize.id === size.id 
                ? 'bg-teal-600 text-white border-teal-600' 
                : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600'
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {FEATURES.map((f, idx) => (
            <button
              key={idx}
              onClick={() => generateAndDownload(idx)}
              disabled={isGenerating}
              className="w-full p-4 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl flex items-center justify-between hover:bg-teal-50 dark:hover:bg-slate-600 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{f.icon}</span>
                <div className="text-left">
                  <div className="font-bold text-sm text-gray-800 dark:text-white">{f.title}</div>
                  <div className="text-[10px] text-gray-400">Görsel {idx + 1} / 4</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          ))}
        </div>

        <canvas 
          ref={canvasRef} 
          width={selectedSize.width} 
          height={selectedSize.height} 
          className="hidden" 
        />
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 max-w-md">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>💡 İpucu:</strong> Google Play, her iki tablet boyutu için de en az 4'er adet görsel yüklemenizi önerir. Yukarıdaki 4 farklı özelliği de indirip mağaza paneline yükleyebilirsiniz.
        </p>
      </div>
    </div>
  );
};

export default ScreenshotGenerator;
