import React, { useState } from 'react';
import { VerseData } from '../types';

interface VerseCardProps {
  verse: VerseData | null;
}

const VerseCard: React.FC<VerseCardProps> = ({ verse }) => {
  const [isSharing, setIsSharing] = useState(false);

  if (!verse) {
    return (
      <div className="w-full p-6 bg-[#fdfbf7] dark:bg-[#1e293b] rounded-xl shadow border border-amber-100 dark:border-slate-700 animate-pulse h-48"></div>
    );
  }

  const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
  };

  const handleShare = async () => {
    if (!verse) return;
    setIsSharing(true);

    try {
      const canvas = document.createElement('canvas');
      // 1080x1920 is standard Instagram Story resolution
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // 1. Background (Teal/Islamic Gradient)
      const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
      gradient.addColorStop(0, '#0f2e2e'); // Dark Teal
      gradient.addColorStop(0.5, '#115e59'); // Teal
      gradient.addColorStop(1, '#0f2e2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Decorative Border
      ctx.strokeStyle = '#d4af37'; // Gold
      ctx.lineWidth = 20;
      ctx.strokeRect(50, 50, 980, 1820);
      
      // Inner thin border
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.lineWidth = 5;
      ctx.strokeRect(80, 80, 920, 1760);

      // 3. Header "Günün Ayeti"
      ctx.fillStyle = '#d4af37'; // Gold
      ctx.font = 'bold 60px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("GÜNÜN AYETİ", 540, 250);

      // Divider
      ctx.beginPath();
      ctx.moveTo(340, 280);
      ctx.lineTo(740, 280);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 4. Arabic Text (Always uses Amiri or similar for correct rendering)
      ctx.fillStyle = '#ffffff';
      ctx.font = '80px Amiri, serif'; // Explicitly keep serif for Arabic
      ctx.direction = 'rtl';
      // Simple wrapping for Arabic roughly centered
      const arabicY = drawText(ctx, verse.arabic, 540, 500, 800, 110);

      // 5. Turkish Translation
      ctx.fillStyle = '#e2e8f0'; // Slate-200
      ctx.font = 'italic 50px sans-serif';
      ctx.direction = 'ltr';
      const turkishStartY = arabicY + 150; // Spacing after Arabic
      const turkishY = drawText(ctx, `"${verse.turkish}"`, 540, turkishStartY, 800, 70);

      // 6. Reference
      ctx.fillStyle = '#d4af37'; // Gold
      ctx.font = 'bold 45px sans-serif';
      ctx.fillText(verse.reference, 540, turkishY + 100);

      // 7. Footer / Branding
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '30px sans-serif';
      ctx.fillText("Namaz Vakti Pro Uygulaması", 540, 1800);

      // Convert to Blob and Share
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], 'gunun_ayeti.png', { type: 'image/png' });

        if (navigator.share) {
          try {
            await navigator.share({
              files: [file],
              title: 'Günün Ayeti',
              text: `${verse.reference} - Namaz Vakti Pro ile paylaşıldı.`,
            });
          } catch (shareError) {
             console.log("Share cancelled or failed", shareError);
          }
        } else {
          // Fallback for Desktop: Download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'gunun_ayeti.png';
          a.click();
          URL.revokeObjectURL(url);
        }
        setIsSharing(false);
      }, 'image/png');

    } catch (e) {
      console.error("Canvas error", e);
      setIsSharing(false);
    }
  };

  return (
    <div className="relative w-full group">
       {/* Card Frame */}
       <div className="bg-[#fdfbf7] dark:bg-[#1a202c] rounded-xl p-1 shadow-md border border-amber-200 dark:border-slate-700">
          <div className="border border-double border-amber-200/60 dark:border-slate-600 rounded-lg p-6 md:p-8 relative overflow-hidden">
             
             {/* Corner Ornaments */}
             <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl-lg"></div>
             <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400 rounded-tr-lg"></div>
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400 rounded-bl-lg"></div>
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br-lg"></div>

             {/* Background Watermark */}
             <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                 <svg className="w-48 h-48 text-teal-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 3.5L18.5 20h-13L12 5.5z"/></svg>
             </div>

             <div className="relative z-10 text-center">
                 <div className="inline-flex items-center gap-2 mb-4 opacity-70">
                    <span className="h-px w-6 bg-teal-600 dark:bg-amber-500"></span>
                    <h3 className="text-teal-800 dark:text-amber-500 font-sans font-bold uppercase tracking-widest text-xs">Günün Ayeti</h3>
                    <span className="h-px w-6 bg-teal-600 dark:bg-amber-500"></span>
                 </div>

                 <p className="text-2xl md:text-3xl font-quran text-slate-800 dark:text-slate-100 mb-6 leading-relaxed" dir="rtl" lang="ar">
                    {verse.arabic}
                 </p>
                 
                 <p className="text-slate-600 dark:text-slate-400 italic font-sans text-lg mb-6 leading-relaxed">
                    "{verse.turkish}"
                 </p>
                 
                 <div className="inline-block px-4 py-1.5 bg-amber-50 dark:bg-slate-800 text-teal-800 dark:text-teal-400 rounded-full text-xs font-bold border border-amber-100 dark:border-slate-600 tracking-wide uppercase font-sans">
                    {verse.reference}
                 </div>
             </div>
          </div>
       </div>

       {/* Share Button (Floating Bottom Right) */}
       <button
        onClick={handleShare}
        disabled={isSharing}
        className="absolute bottom-4 right-4 z-20 px-6 py-2 bg-white dark:bg-slate-800 text-teal-700 dark:text-amber-500 rounded-full shadow-lg border border-amber-100 dark:border-slate-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center font-bold text-sm tracking-wide font-sans"
        title="Hikayende Paylaş"
       >
         {isSharing ? (
           <span className="flex items-center gap-2">
               <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               <span>Hazırlanıyor</span>
           </span>
         ) : (
           "PAYLAŞ"
         )}
       </button>
    </div>
  );
};

export default VerseCard;