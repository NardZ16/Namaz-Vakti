
import React, { useState, useEffect, useRef } from 'react';
import { SURAH_NAMES } from '../data/surahNames';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Ayah {
  number: number; // Global number
  text: string; // Arabic
  translation?: string; // Turkish
  numberInSurah: number;
  audio?: string;
}

interface Bookmark {
    surahNumber: number;
    ayahNumberInSurah: number;
    surahName: string;
    timestamp: number;
}

const QuranReader: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [shouldScrollToBookmark, setShouldScrollToBookmark] = useState(false);
  
  // Audio & Playback State
  const [activeAyahIndex, setActiveAyahIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ayahRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Cache for Surah list and Bookmark
  useEffect(() => {
    // Load Bookmark
    const savedBookmark = localStorage.getItem('quran_bookmark');
    if (savedBookmark) {
        try {
            setBookmark(JSON.parse(savedBookmark));
        } catch (e) {
            console.error("Bookmark parse error", e);
        }
    }

    const fetchSurahs = async () => {
      const cached = localStorage.getItem('quran_surahs');
      if (cached) {
        setSurahs(JSON.parse(cached));
        return;
      }

      try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        if (data.code === 200) {
          setSurahs(data.data);
          localStorage.setItem('quran_surahs', JSON.stringify(data.data));
        }
      } catch (error) {
        console.error("Failed to fetch surahs", error);
      }
    };

    fetchSurahs();
  }, []);

  // Fetch Verse content when a Surah is selected
  useEffect(() => {
    if (!selectedSurah) {
        setAyahs([]);
        setActiveAyahIndex(-1);
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        return;
    }

    const fetchContent = async () => {
        setLoading(true);
        try {
            // Fetch Arabic Text (Simple clean) and Turkish Translation
            // Using quran-simple for better readability as requested
            const res = await fetch(`https://api.alquran.cloud/v1/surah/${selectedSurah.number}/editions/quran-simple,tr.diyanet`);
            const data = await res.json();
            
            if (data.code === 200 && data.data.length >= 2) {
                const arabicData = data.data[0].ayahs;
                const turkishData = data.data[1].ayahs;

                const mergedAyahs = arabicData.map((ayah: any, index: number) => {
                    let text = ayah.text;
                    
                    // Clean Bismillah from the first verse of Surahs (except Fatiha and Tawbah)
                    if (selectedSurah.number !== 1 && selectedSurah.number !== 9 && index === 0) {
                        text = text.replace(/^بِسْمِ\s+[ٱا]llāh\s+[ٱا]l-?raḥmān\s+[ٱا]l-?raḥīm\s*/i, "").trim(); 
                        text = text.replace(/^بِسْمِ\s+[ٱا]للَّهِ\s+[ٱا]لرَّحْمَٰنِ\s+[ٱا]لرَّحِيمِ\s*/, "").trim();
                    }

                    return {
                        number: ayah.number, // Global number used for audio
                        text: text,
                        numberInSurah: ayah.numberInSurah,
                        translation: turkishData[index]?.text || '',
                        audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`
                    };
                });

                setAyahs(mergedAyahs);
                ayahRefs.current = new Array(mergedAyahs.length).fill(null);
            }

        } catch (error) {
            console.error("Failed to fetch surah details", error);
        } finally {
            setLoading(false);
        }
    };

    fetchContent();
  }, [selectedSurah]);

  // Handle Scroll to Bookmark after data loads
  useEffect(() => {
    if (!loading && ayahs.length > 0 && shouldScrollToBookmark && bookmark) {
        const index = ayahs.findIndex(a => a.numberInSurah === bookmark.ayahNumberInSurah);
        if (index !== -1 && ayahRefs.current[index]) {
            setTimeout(() => {
                ayahRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
        setShouldScrollToBookmark(false); // Reset flag
    }
  }, [loading, ayahs, shouldScrollToBookmark, bookmark]);


  // Handle Audio Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
        if (activeAyahIndex < ayahs.length - 1) {
            playAyah(activeAyahIndex + 1);
        } else {
            setIsPlaying(false);
            setActiveAyahIndex(-1);
        }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [activeAyahIndex, ayahs]);

  // Handle Bookmarking
  const toggleBookmark = (e: React.MouseEvent, ayah: Ayah) => {
    e.stopPropagation();
    if (!selectedSurah) return;

    // Check if this is already the bookmark
    const isBookmarked = bookmark?.surahNumber === selectedSurah.number && bookmark?.ayahNumberInSurah === ayah.numberInSurah;

    if (isBookmarked) {
        // Remove bookmark
        setBookmark(null);
        localStorage.removeItem('quran_bookmark');
    } else {
        // Set bookmark
        const newBookmark: Bookmark = {
            surahNumber: selectedSurah.number,
            surahName: getSurahName(selectedSurah.number),
            ayahNumberInSurah: ayah.numberInSurah,
            timestamp: Date.now()
        };
        setBookmark(newBookmark);
        localStorage.setItem('quran_bookmark', JSON.stringify(newBookmark));
    }
  };

  const jumpToBookmark = () => {
      if (!bookmark) return;
      // Find the surah object
      const s = surahs.find(sur => sur.number === bookmark.surahNumber);
      if (s) {
          setSelectedSurah(s);
          setShouldScrollToBookmark(true);
      }
  };

  const playAyah = (index: number) => {
      if (index < 0 || index >= ayahs.length) return;
      
      setActiveAyahIndex(index);
      setIsPlaying(true);
      
      if (audioRef.current) {
          audioRef.current.src = ayahs[index].audio || '';
          audioRef.current.play().catch(e => console.error("Play error:", e));
      }
  };

  const togglePlayPause = () => {
      if (!audioRef.current) return;

      if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
      } else {
          if (activeAyahIndex === -1) {
              playAyah(0);
          } else {
              audioRef.current.play();
              setIsPlaying(true);
          }
      }
  };

  // Helper to get Turkish Name
  const getSurahName = (surahNumber: number) => {
      return SURAH_NAMES[surahNumber - 1] || `Sure ${surahNumber}`;
  };

  const filteredSurahs = surahs.filter(s => 
    getSurahName(s.number).toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.englishName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBack = () => {
    setSelectedSurah(null);
    setSearchTerm('');
    setShouldScrollToBookmark(false);
  };

  // Surah List View
  if (!selectedSurah) {
    return (
        <div className="h-full flex flex-col bg-[#fdfbf7] dark:bg-slate-900">
            {/* Search Header */}
            <div className="p-4 border-b border-amber-100 dark:border-slate-700 bg-[#fdfbf7] dark:bg-slate-800 sticky top-0 z-10 space-y-3">
                
                {/* Continue Reading Button */}
                {bookmark && (
                    <button 
                        onClick={jumpToBookmark}
                        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-slate-800 border border-amber-200 dark:border-amber-800 rounded-xl shadow-sm group hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-3">
                             <div className="bg-amber-500 text-white p-2 rounded-lg shadow-sm">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                             </div>
                             <div className="text-left">
                                <div className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wide font-sans">Kaldığım Yer</div>
                                <div className="text-sm font-bold text-gray-800 dark:text-white font-sans">
                                    {bookmark.surahName}, {bookmark.ayahNumberInSurah}. Ayet
                                </div>
                             </div>
                        </div>
                        <div className="text-amber-600 dark:text-amber-500">
                             <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </button>
                )}

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Sure ara (Örn: Fatiha, Yasin)..."
                        className="w-full p-3 pl-10 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white placeholder-gray-500 font-sans"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 pb-24">
                {surahs.length === 0 ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-1">
                        {filteredSurahs.map(surah => (
                            <button
                                key={surah.number}
                                onClick={() => setSelectedSurah(surah)}
                                className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-gray-50 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700/50 transition-colors group rounded-lg mb-1 shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg font-bold text-emerald-700 dark:text-emerald-400 text-xs font-sans">
                                        {surah.number}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-800 dark:text-white group-hover:text-emerald-600 transition-colors font-sans">
                                            {getSurahName(surah.number)}
                                        </div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-wide font-sans">
                                            {surah.revelationType === 'Meccan' ? 'Mekke' : 'Medine'} • {surah.numberOfAyahs} Ayet
                                        </div>
                                    </div>
                                </div>
                                {/* Arabic Name remains distinct */}
                                <div className="font-quran text-2xl text-gray-400 dark:text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity" lang="ar">
                                    {surah.name.replace('سورة', '').trim()}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
  }

  // Surah Reading View
  return (
    <div className="h-full flex flex-col bg-[#fdfbf7] dark:bg-slate-950 relative">
        {/* Audio Element (Hidden) */}
        <audio ref={audioRef} className="hidden" />

        {/* Header with Controls */}
        <div className="bg-[#fdfbf7]/95 dark:bg-slate-900/95 border-b border-amber-200/50 dark:border-slate-800 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
             <div className="flex items-center justify-between px-4 py-3">
                <button onClick={handleBack} className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors bg-white border border-gray-100 dark:border-slate-700 dark:bg-slate-800 py-1.5 px-3 rounded-lg font-sans">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    Geri
                </button>
                
                <div className="text-center">
                    <h2 className="font-sans font-bold text-lg text-gray-800 dark:text-white">{getSurahName(selectedSurah.number)}</h2>
                </div>

                {/* Play Controls */}
                <button 
                    onClick={togglePlayPause}
                    className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-md"
                >
                    {isPlaying ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                    ) : (
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                </button>
             </div>
             
             {/* Progress Bar (Visual Only) */}
             {activeAyahIndex !== -1 && (
                 <div className="w-full h-1 bg-gray-100 dark:bg-slate-800">
                     <div 
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${((activeAyahIndex + 1) / ayahs.length) * 100}%` }}
                     ></div>
                 </div>
             )}
        </div>

        {/* Content - COMPACT FLOW READING MODE */}
        <div className="flex-1 overflow-y-auto pb-24 scroll-smooth bg-[#fdfbf7] dark:bg-slate-950">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
                    <p className="text-gray-500 font-sans">Sayfa hazırlanıyor...</p>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto py-4">
                    {/* Bismillah (Skip for Tawbah/Surah 9) */}
                    {selectedSurah.number !== 9 && (
                        <div className="text-center py-6 mb-2">
                            <div className="font-quran text-2xl md:text-3xl text-gray-800 dark:text-gray-200" lang="ar">
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </div>
                        </div>
                    )}

                    <div className="px-2">
                        {ayahs.map((ayah, index) => {
                            const isActive = index === activeAyahIndex;
                            const isBookmarked = bookmark?.surahNumber === selectedSurah.number && bookmark?.ayahNumberInSurah === ayah.numberInSurah;
                            
                            return (
                                <div 
                                    key={ayah.number} 
                                    ref={(el) => { ayahRefs.current[index] = el; }}
                                    className={`
                                        py-3 px-3 rounded-lg relative transition-colors duration-200 
                                        ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'hover:bg-amber-50/50 dark:hover:bg-slate-900'}
                                        ${isBookmarked ? 'bg-amber-50 dark:bg-amber-900/10' : ''}
                                    `}
                                >
                                    {/* Content Container */}
                                    <div className="flex flex-col gap-1">
                                        
                                        {/* Arabic Text with Inline Verse Marker */}
                                        <div className="relative text-right" dir="rtl">
                                            <span 
                                                className="font-quran text-3xl md:text-4xl leading-[2.2] text-gray-800 dark:text-gray-100 select-text" 
                                                lang="ar"
                                            >
                                                {ayah.text}
                                            </span>
                                            
                                            {/* Decorative Verse End Marker (Inline) */}
                                            <span className="inline-flex items-center justify-center w-8 h-8 mr-2 align-middle font-sans text-sm text-emerald-700 dark:text-emerald-400 font-bold border-2 border-emerald-200 dark:border-emerald-800 rounded-full bg-white dark:bg-slate-800 select-none mx-1">
                                                {ayah.numberInSurah}
                                            </span>
                                        </div>

                                        {/* Translation Row + Small Controls */}
                                        <div className="flex items-start justify-between gap-4 mt-1 pl-1" dir="ltr">
                                             <p className="text-xs text-gray-400 dark:text-gray-500 leading-normal flex-1 pt-1 font-medium font-sans">
                                                {ayah.translation}
                                             </p>
                                             
                                             {/* Mini Controls */}
                                             <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                                 <button 
                                                    onClick={(e) => toggleBookmark(e, ayah)}
                                                    className={`${isBookmarked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'} p-1`}
                                                    title="İşaretle"
                                                 >
                                                     {isBookmarked ? (
                                                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                                                     ) : (
                                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                                     )}
                                                 </button>

                                                 <button 
                                                    onClick={() => playAyah(index)}
                                                    className={`${isActive ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-500'} p-1`}
                                                    title="Dinle"
                                                 >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                 </button>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="text-center pt-8 pb-8 text-gray-300 dark:text-slate-600 text-xs font-sans italic">
                        Sadakallahülazim
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default QuranReader;
