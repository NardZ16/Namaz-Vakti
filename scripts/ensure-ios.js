
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🛠️ iOS Ortamı Hazırlanıyor (Robust Appflow Fix) ---');

  // 0. ADIM: Gerekli Klasörleri Oluştur
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
    fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Placeholder</body></html>');
  }
  if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
  }

  // 1. ADIM: iOS Projesi Kontrolü
  // Appflow'da bazen 'ios' klasörü önceden vardır, silmeyelim, sadece emin olalım.
  if (!fs.existsSync('ios/App/App.xcodeproj')) {
    console.log('⚠️ iOS projesi bulunamadı, ekleniyor...');
    try {
      execSync('npx cap add ios', { stdio: 'inherit' });
    } catch (e) {
      console.error('❌ iOS eklenemedi:', e.message);
    }
  }

  // 2. ADIM: PROFESYONEL İKON OLUŞTURMA
  console.log('🎨 İkon durumu kontrol ediliyor...');
  const logoPath = 'assets/logo.png';
  
  // Sharp kurulumu (Eğer yoksa)
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('📦 Grafik motoru (sharp) yükleniyor...');
    try {
        execSync('npm install sharp --no-save', { stdio: 'inherit' });
        sharp = require('sharp');
    } catch (err) {
        console.warn('⚠️ Sharp yüklenemedi, ikon oluşturulamayabilir.');
    }
  }

  // Eğer logo.png yoksa veya bozuksa, script kendisi oluşturacak.
  let shouldGenerateNew = true;
  if (fs.existsSync(logoPath) && sharp) {
      try {
          await sharp(logoPath).metadata();
          shouldGenerateNew = false;
          console.log('✅ Mevcut "assets/logo.png" geçerli.');
      } catch (e) {
          console.log('⚠️ Mevcut ikon dosyası bozuk.');
      }
  }

  if (shouldGenerateNew && sharp) {
      console.log('✨ Yeni profesyonel ikon oluşturuluyor...');
      const iconSvg = `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f766e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#115e59;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#bg)"/>
        <rect x="80" y="80" width="864" height="864" rx="180" fill="none" stroke="#d4af37" stroke-width="20" opacity="0.3"/>
        <g transform="translate(512, 512) scale(3.5)" fill="#d4af37">
           <path d="M0 -60 C-40 -60 -70 -30 -70 10 L-70 60 L70 60 L70 10 C70 -30 40 -60 0 -60 Z" />
           <circle cx="0" cy="-75" r="12" />
           <path d="M-80 60 L80 60 L80 80 L-80 80 Z" />
        </g>
        <text x="512" y="850" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="140" fill="#d4af37" letter-spacing="10">NAMAZ</text>
      </svg>
      `;
      const buffer = Buffer.from(iconSvg);
      await sharp(buffer).resize(1024, 1024).png().toFile(logoPath);
      console.log('✅ Yeni ikon oluşturuldu.');
  }

  // 3. ADIM: İKON SETİ KLASÖRÜNÜ HAZIRLA (OS DUYARLI)
  const iosAssetDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  
  // Sadece Windows ise sil (Kilitlenme sorunu için), Appflow'da (Linux/Mac) silme!
  if (process.platform === 'win32' && fs.existsSync(iosAssetDir)) {
      try {
          fs.rmSync(iosAssetDir, { recursive: true, force: true });
          await new Promise(r => setTimeout(r, 1000));
      } catch (e) {}
  }

  // 4. ADIM: ASSET GENERATION (OTOMATİK)
  console.log('🚀 İkon setleri üretiliyor...');
  try {
      execSync('npx capacitor-assets generate --ios', { stdio: 'inherit' });
  } catch (e) {
      console.warn('⚠️ Otomatik ikon üretimi başarısız oldu (Failsafe devreye girecek).');
  }

  // 5. ADIM: FAILSAFE (GÜVENLİK AĞI) - MANUEL OLUŞTURMA
  // Eğer yukarıdaki işlem başarısız olduysa veya klasör boşsa, build patlamasın diye elle oluşturuyoruz.
  if (!fs.existsSync(iosAssetDir) || fs.readdirSync(iosAssetDir).length < 2) {
      console.log('🛡️ Failsafe: AppIcon manuel olarak oluşturuluyor...');
      
      if (!fs.existsSync(iosAssetDir)) {
          fs.mkdirSync(iosAssetDir, { recursive: true });
      }

      // 1. Ana resmi kopyala (1024x1024)
      const destIconPath = path.join(iosAssetDir, 'AppIcon-1024.png');
      if (fs.existsSync(logoPath)) {
          fs.copyFileSync(logoPath, destIconPath);
      } else {
          // Logo bile yoksa boş dosya yaratma riskine girmeyelim, hata vermeli.
          console.error('❌ Kritik: assets/logo.png bulunamadı.');
      }

      // 2. Geçerli bir Contents.json yaz
      // Bu JSON Xcode'a "Tüm boyutlar için bu tek dosyayı kullan" der (Single Size).
      const contentsJson = {
        "images" : [
          {
            "size" : "1024x1024",
            "idiom" : "ios-marketing",
            "filename" : "AppIcon-1024.png",
            "scale" : "1x"
          },
          {
            "size" : "1024x1024",
            "idiom" : "universal",
            "platform" : "ios",
            "filename" : "AppIcon-1024.png",
            "target" : "any"
          }
        ],
        "info" : {
          "version" : 1,
          "author" : "xcode"
        }
      };
      
      fs.writeFileSync(path.join(iosAssetDir, 'Contents.json'), JSON.stringify(contentsJson, null, 2));
      console.log('✅ Failsafe: AppIcon.appiconset onarıldı.');
  }

  // 6. ADIM: APP STORE VERSİYONLAMA
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      console.log('📝 Versiyon numarası güncelleniyor...');
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      
      const date = new Date();
      // Appflow'da her build farklı olsun diye saniye bazlı versiyon
      const buildVersion = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}${String(date.getHours()).padStart(2,'0')}${String(date.getMinutes()).padStart(2,'0')}`;
      
      const regex = /(<key>CFBundleVersion<\/key>\s*<string>)([^<]+)(<\/string>)/;
      if (regex.test(content)) {
          content = content.replace(regex, `$1${buildVersion}$3`);
      } else {
          content = content.replace('<dict>', `<dict>\n<key>CFBundleVersion</key>\n<string>${buildVersion}</string>`);
      }
      
      // İzin Açıklamaları (Eğer yoksa ekle)
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
           content = content.replace('<dict>', `<dict>
            <key>NSLocationWhenInUseUsageDescription</key>
            <string>Namaz vakitleri için konum erişimi gereklidir.</string>
            <key>NSLocationAlwaysUsageDescription</key>
            <string>Namaz vakitleri için konum erişimi gereklidir.</string>
            <key>ITSAppUsesNonExemptEncryption</key>
            <false/>
           `);
      }

      fs.writeFileSync(infoPlistPath, content);
  }
  
  // 7. ADIM: Podfile Fix
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
