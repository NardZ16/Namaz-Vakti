
import React, { useRef, useState } from 'react';

const FeatureGraphicGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAndDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsGenerating(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Arkaplan - Koyu Teal Gradyan
    const gradient = ctx.createLinearGradient(0, 0, 1024, 500);
    gradient.addColorStop(0, '#0f2e2e');
    gradient.addColorStop(0.5, '#115e59');
    gradient.addColorStop(1, '#0f2e2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 500);

    // 2. Arabesk Desen Overlay (Basit çizimlerle)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 1024; i += 40) {
      for (let j = 0; j < 500; j += 40) {
        ctx.strokeRect(i, j, 30, 30);
      }
    }

    // 3. Dekoratif Hilal ve Yıldız (Arkaplanda büyük ve şeffaf)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.arc(850, 250, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f2e2e'; // Cutting the moon
    ctx.beginPath();
    ctx.arc(810, 250, 180, 0, Math.PI * 2);
    ctx.fill();

    // 4. Ana Başlık - Namaz Vakti Pro
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Namaz Vakti Pro", 512, 240);

    // 5. Alt Başlık / Slogan
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d4af37'; // Gold
    ctx.font = '34px sans-serif';
    ctx.fillText("Diyanet Uyumlu, Modern ve Ücretsiz", 512, 300);

    // 6. Dekoratif Çizgiler
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(412, 330);
    ctx.lineTo(612, 330);
    ctx.stroke();

    // 7. Özellik İkonları (Basit metin/şekil)
    ctx.font = '22px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText("Ezan Bildirimi • Kıble Pusulası • Zikirmatik • Kuran-ı Kerim", 512, 420);

    // Download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'google_play_feature_graphic.png';
        a.click();
        URL.revokeObjectURL(url);
      }
      setIsGenerating(false);
    }, 'image/png');
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center space-y-6">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-amber-200 dark:border-slate-700 w-full max-w-lg">
        <h3 className="text-lg font-bold text-teal-900 dark:text-amber-500 mb-2">Mağaza Görseli Oluşturucu</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Google Play Store için gerekli olan 1024x500 boyutundaki "Özellik Grafiği" görselini otomatik oluşturur.
        </p>
        
        <canvas 
          ref={canvasRef} 
          width="1024" 
          height="500" 
          className="w-full h-auto rounded-lg border border-gray-200 dark:border-slate-600 mb-4 hidden md:block"
          style={{ aspectRatio: '1024/500' }}
        />

        <button 
          onClick={generateAndDownload}
          disabled={isGenerating}
          className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          )}
          <span>Görseli Oluştur ve İndir (1024x500)</span>
        </button>
      </div>

      <div className="text-xs text-gray-400 text-center max-w-xs">
        * İndirilen görseli Google Play Console'da "Ana Mağaza Girişi" bölümündeki "Özellik Grafiği" alanına yükleyebilirsiniz.
      </div>
    </div>
  );
};

export default FeatureGraphicGenerator;
