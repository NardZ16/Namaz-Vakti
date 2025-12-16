
import React from 'react';
import { isNative } from '../services/nativeService';

const Contact: React.FC = () => {
  const handleEmail = () => {
    window.location.href = "mailto:mchtaydn18@gmail.com?subject=Namaz Vakti Pro Destek&body=Merhaba, uygulama hakkında bir sorum var:";
  };

  const handlePrivacy = () => {
    window.open('privacy.html', '_blank');
  };

  const checkAdsTxt = () => {
    // Tarayıcıda yeni sekmede açar
    window.open(window.location.origin + '/app-ads.txt', '_blank');
  };

  return (
    <div className="h-full overflow-y-auto p-4 pb-24 flex flex-col items-center">
      <div className="w-full max-w-sm mt-4">
        
        <div className="bg-gradient-to-br from-teal-600 to-emerald-800 rounded-3xl p-8 text-center text-white shadow-xl relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400/20 rounded-full blur-xl translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h2 className="text-2xl font-bold font-sans mb-2">Bize Ulaşın</h2>
                <p className="text-emerald-100 text-sm mb-6">Öneri, şikayet veya sorularınız için destek ekibimize yazabilirsiniz.</p>
                
                <button 
                    onClick={handleEmail}
                    className="w-full py-3 bg-white text-teal-800 font-bold rounded-xl hover:bg-emerald-50 active:scale-95 transition-all shadow-md"
                >
                    E-posta Gönder
                </button>
            </div>
        </div>

        <div className="space-y-3">
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                 <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600 dark:text-amber-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <div className="flex-1">
                     <h3 className="font-bold text-gray-800 dark:text-white text-sm">Uygulama Sürümü</h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400">v1.3.0 (Build 2024)</p>
                 </div>
             </div>

             <button 
                onClick={handlePrivacy}
                className="w-full bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
             >
                 <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 </div>
                 <div className="flex-1">
                     <h3 className="font-bold text-gray-800 dark:text-white text-sm">Gizlilik Politikası</h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Kişisel veri kullanımı hakkında</p>
                 </div>
                 <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
             </button>

             {/* Sadece Web sürümünde görünür - Test Amaçlı */}
             {!isNative() && (
                 <button 
                    onClick={checkAdsTxt}
                    className="w-full bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
                 >
                     <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-600 dark:text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                     </div>
                     <div className="flex-1">
                         <h3 className="font-bold text-gray-800 dark:text-white text-sm">app-ads.txt Kontrol</h3>
                         <p className="text-xs text-gray-500 dark:text-gray-400">Dosya erişimini test et</p>
                     </div>
                 </button>
             )}
        </div>

        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-600 font-sans">
                Namaz Vakti Pro<br/>
                Made with ❤️ for Ummah
            </p>
        </div>

      </div>
    </div>
  );
};

export default Contact;
