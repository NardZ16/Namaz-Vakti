
import { GoogleGenAI, Type } from "@google/genai";
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

  // 2. Fetch from API if not cached
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Dynamic Topic Selection based on day of month to ensure variety
    // This forces the AI to look at different parts of the Quran each day
    const topics = [
      "sabır, imtihan ve dayanıklılık",
      "şükür, nimetler ve hamd",
      "bağışlanma, tövbe ve rahmet",
      "dua, istemek ve yakarış",
      "iyilik, infak ve sadaka",
      "adalet, dürüstlük ve hak",
      "umut, müjde ve ahiret",
      "tevekkül, güven ve teslimiyet",
      "anne baba hakkı, aile ve akraba",
      "doğa, evren ve tefekkür"
    ];
    
    // Use day of month to pick a topic cyclically
    const topicIndex = now.getDate() % topics.length;
    const todayTopic = topics[topicIndex];

    const prompt = `Bugün tarih: ${todayStr}. 
    Bana Kuran-ı Kerim'den özellikle "${todayTopic}" konusuyla ilgili, insanı derinden etkileyen ve motive eden tek bir ayet ver.
    
    Önemli Kurallar:
    1. Lütfen her zaman en bilinen popüler ayetleri (Örn: Bakara 153 veya İnşirah Suresi gibi) tekrar etme. Daha az paylaşılan ama anlamlı ayetlerden seç.
    2. Yanıtı kesinlikle geçerli bir JSON formatında ver.
    3. Arapça metni, Türkçe meali ve Referans (Sure Adı, Ayet No) bilgisi içermeli.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        // High temperature for creativity and randomness
        temperature: 1.3,
        // TopK ensures we pick from a wider pool of words
        topK: 60,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            arabic: { type: Type.STRING, description: "Ayetin Arapça metni" },
            turkish: { type: Type.STRING, description: "Ayetin Türkçe meali" },
            reference: { type: Type.STRING, description: "Sure adı ve ayet numarası (Örn: Zümer, 53)" }
          },
          required: ["arabic", "turkish", "reference"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const data = JSON.parse(text) as VerseData;

    // 3. Save to cache
    try {
      // Clear old keys to prevent bloat
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('verse_data_') && key !== cachedKey) {
          localStorage.removeItem(key);
        }
      }
      localStorage.setItem(cachedKey, JSON.stringify(data));
    } catch (e) {
      console.warn("Cache write error", e);
    }
    
    return data;
  } catch (error) {
    console.error("Gemini API error:", error);
    
    // Fallback verses if API fails (Rotates based on day)
    const fallbacks = [
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
        }
    ];
    
    return fallbacks[now.getDate() % fallbacks.length];
  }
};
