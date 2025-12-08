import { VerseData } from "../types";

export const fetchDailyVerse = async (): Promise<VerseData> => {
  // 1. Check Local Storage for today's verse using Local Time
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`; // Local YYYY-M-D
  const cachedKey = `verse_data_${todayStr}`;
  
  try {
    const cached = localStorage.getItem(cachedKey);
    if (cached) {
      return JSON.parse(cached) as VerseData;
    }
  } catch (e) {
    console.warn("Cache read error", e);
  }

  // 2. Local Verse Database (Replacing AI generation)
  // Rotating selection based on day of month
  const verses = [
        {
            arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
            turkish: "Şüphesiz Allah sabredenlerle beraberdir.",
            reference: "Bakara, 153"
        },
        {
            arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
            turkish: "Muhakkak ki zorlukla beraber bir kolaylık vardır.",
            reference: "İnşirah, 5"
        },
        {
            arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
            turkish: "Allah hiç kimseye taşıyabileceğinden fazlasını yüklemez.",
            reference: "Bakara, 286"
        },
        {
            arabic: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",
            turkish: "De ki: Ey kendilerine kötülük edip aşırı giden kullarım! Allah'ın rahmetinden ümidinizi kesmeyin.",
            reference: "Zümer, 53"
        },
        {
            arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ",
            turkish: "Kullarım sana beni sorduğunda, (söyle onlara): Ben çok yakınım. Bana dua ettiğinde, dua edenin çağrısına karşılık veririm.",
            reference: "Bakara, 186"
        },
        {
            arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
            turkish: "Bilesiniz ki, kalpler ancak Allah'ı anmakla huzur bulur.",
            reference: "Ra'd, 28"
        },
        {
            arabic: "وَاللَّهُ يَرْزُقُ مَن يَشَاءُ بِغَيْرِ حِسَابٍ",
            turkish: "Allah dilediğine hesapsız rızık verir.",
            reference: "Bakara, 212"
        },
        {
            arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
            turkish: "Allah bize yeter, O ne güzel vekildir.",
            reference: "Ali İmran, 173"
        },
        {
            arabic: "إِنَّ رَحْمَتَ اللَّهِ قَرِيبٌ مِّنَ الْمُحْسِنِينَ",
            turkish: "Muhakkak ki Allah'ın rahmeti, iyilik edenlere yakındır.",
            reference: "A'raf, 56"
        },
        {
            arabic: "وَقُل رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
            turkish: "De ki: Rabbim! Onlar beni küçükken (nasıl şefkatle) yetiştirdilerse, sen de onlara (öyle) merhamet et.",
            reference: "İsra, 24"
        }
    ];
    
    // Select verse cyclically
    const selectedVerse = verses[now.getDate() % verses.length];

    // 3. Save to cache
    try {
      // Clear old keys to prevent bloat
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('verse_data_') && key !== cachedKey) {
          localStorage.removeItem(key);
        }
      }
      localStorage.setItem(cachedKey, JSON.stringify(selectedVerse));
    } catch (e) {
      console.warn("Cache write error", e);
    }
    
    return selectedVerse;
};