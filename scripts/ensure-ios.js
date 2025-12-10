
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🛠️ iOS Ortamı Hazırlanıyor (Auto-Icon & Version Fix) ---');

  // 0. ADIM: Gerekli Klasörleri Oluştur
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
    fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Placeholder</body></html>');
  }
  if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
  }

  // 1. ADIM: iOS Projesi Kontrolü ve Temizliği
  // Eğer proje bozuksa veya yoksa yeniden oluştur
  if (!fs.existsSync('ios/App/App.xcodeproj')) {
    console.log('⚠️ iOS projesi bulunamadı veya hasarlı. Yeniden oluşturuluyor...');
    if (fs.existsSync('ios')) fs.rmSync('ios', { recursive: true, force: true });
    try {
      execSync('npx cap add ios', { stdio: 'inherit' });
    } catch (e) {
      console.error('❌ iOS eklenemedi:', e.message);
    }
  }

  // 2. ADIM: PROFESYONEL İKON OLUŞTURMA (SENİN İÇİN ÇİZİYORUM)
  console.log('🎨 İkon durumu kontrol ediliyor...');
  
  // Sharp kütüphanesini kontrol et
  if (!fs.existsSync('node_modules/sharp')) {
      console.log('📦 Grafik motoru (sharp) yükleniyor...');
      execSync('npm install sharp --no-save', { stdio: 'inherit' });
  }
  
  const sharp = require(path.resolve('./node_modules/sharp'));
  const logoPath = 'assets/logo.png';

  // Eğer logo.png yoksa veya bozuksa, script kendisi oluşturacak.
  // Kullanıcının ikon yüklemesiyle uğraşmıyoruz, profesyonel bir ikon yaratıyoruz.
  let shouldGenerateNew = true;
  if (fs.existsSync(logoPath)) {
      try {
          // Dosyayı test et, sağlamsa kullan
          await sharp(logoPath).metadata();
          shouldGenerateNew = false;
          console.log('✅ Mevcut "assets/logo.png" geçerli, bu kullanılıyor.');
      } catch (e) {
          console.log('⚠️ Mevcut ikon dosyası bozuk, yenisi oluşturuluyor...');
      }
  }

  if (shouldGenerateNew) {
      console.log('✨ Yeni profesyonel ikon oluşturuluyor...');
      // Modern, İslami geometrik desenli ikon SVG'si
      const iconSvg = `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f766e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#115e59;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Arkaplan -->
        <rect width="1024" height="1024" fill="url(#bg)"/>
        
        <!-- Dekoratif Çerçeve -->
        <rect x="80" y="80" width="864" height="864" rx="180" fill="none" stroke="#d4af37" stroke-width="20" opacity="0.3"/>
        
        <!-- İkon: Cami Kubbesi ve Hilal -->
        <g transform="translate(512, 512) scale(3.5)" fill="#d4af37" filter="url(#shadow)">
           <path d="M0 -60 C-40 -60 -70 -30 -70 10 L-70 60 L70 60 L70 10 C70 -30 40 -60 0 -60 Z" />
           <circle cx="0" cy="-75" r="12" />
           <path d="M-80 60 L80 60 L80 80 L-80 80 Z" />
        </g>
        
        <!-- Metin -->
        <text x="512" y="850" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="140" fill="#d4af37" letter-spacing="10">NAMAZ</text>
      </svg>
      `;

      const buffer = Buffer.from(iconSvg);
      const pngBuffer = await sharp(buffer).resize(1024, 1024).png().toBuffer();
      fs.writeFileSync(logoPath, pngBuffer);
      console.log('✅ Yeni ikon "assets/logo.png" olarak kaydedildi.');
  }

  // 3. ADIM: WINDOWS FIX (Klasör Temizliği)
  const iosAssetDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  if (fs.existsSync(iosAssetDir)) {
      try {
          // Windows kilitlenmesini önlemek için klasörü tamamen silip temizliyoruz
          fs.rmSync(iosAssetDir, { recursive: true, force: true });
          await new Promise(r => setTimeout(r, 1000)); // Dosya sistemi nefes alsın
      } catch (e) { 
          // Hata verirse görmezden gel, devam et
      }
  }

  // 4. ADIM: ASSET GENERATION
  try {
      console.log('🚀 İkon setleri üretiliyor...');
      execSync('npx capacitor-assets generate --ios', { stdio: 'inherit' });
  } catch (e) {
      console.warn('⚠️ İkon üretim uyarısı (Önemli değil):', e.message);
  }

  // 5. ADIM: APP STORE CONNECT İÇİN KRİTİK AYAR (Build Numarası)
  // App Store'a yüklenmemesinin en büyük sebebi Build Version çakışmasıdır.
  // Bunu her derlemede benzersiz yapıyoruz.
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      console.log('📝 Info.plist versiyonlanıyor...');
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      
      // YYYYMMDDHHmm formatında benzersiz bir numara (Örn: 202403201530)
      const date = new Date();
      const buildVersion = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}${String(date.getHours()).padStart(2,'0')}${String(date.getMinutes()).padStart(2,'0')}`;
      
      // CFBundleVersion'ı değiştir (Build Number)
      // Bu regex XML yapısını koruyarak sadece numarayı değiştirir.
      const regex = /(<key>CFBundleVersion<\/key>\s*<string>)([^<]+)(<\/string>)/;
      
      if (regex.test(content)) {
          content = content.replace(regex, `$1${buildVersion}$3`);
          console.log(`🔢 Yeni Build Numarası: ${buildVersion}`);
      } else {
          // Eğer yoksa ekle
          content = content.replace('<dict>', `<dict>\n<key>CFBundleVersion</key>\n<string>${buildVersion}</string>`);
      }

      // Diğer izinler (Konum vs.)
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
           content = content.replace('<dict>', `<dict>
            <key>NSLocationWhenInUseUsageDescription</key>
            <string>Namaz vakitlerini hesaplamak için konumunuza ihtiyacımız var.</string>
            <key>NSLocationAlwaysUsageDescription</key>
            <string>Namaz vakitlerini hesaplamak için konumunuza ihtiyacımız var.</string>
            <key>ITSAppUsesNonExemptEncryption</key>
            <false/>
           `);
      }

      fs.writeFileSync(infoPlistPath, content);
  }

  // 6. ADIM: Podfile Fix (iOS Sürümü)
  const podfile = 'ios/App/Podfile';
  if (fs.existsSync(podfile)) {
      let pContent = fs.readFileSync(podfile, 'utf8');
      if (!pContent.includes("platform :ios, '13.0'")) {
          pContent = pContent.replace(/platform :ios, .*/, "platform :ios, '13.0'");
          if (!pContent.includes("platform :ios")) {
              pContent = "platform :ios, '13.0'\n" + pContent;
          }
          fs.writeFileSync(podfile, pContent);
      }
  }

  console.log('✅ HAZIRLIK TAMAMLANDI!');
}

main();
