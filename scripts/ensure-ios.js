
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🛠️ iOS Ortamı Hazırlanıyor (v3 - Zombie Folder Fix) ---');

  // 0. ADIM: Gerekli Klasörleri Oluştur
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
    fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Placeholder</body></html>');
  }
  if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
  }

  // 1. ADIM: iOS Projesi Kontrolü ve ONARIMI
  // Sorun: Appflow'da bazen 'ios' klasörü kalıyor ama içi boş/bozuk oluyor.
  // Çözüm: .xcodeproj yoksa, ios klasörünü kökten silip tekrar oluştur.
  const xcodeProjPath = 'ios/App/App.xcodeproj';
  
  if (!fs.existsSync(xcodeProjPath)) {
    console.log('⚠️ iOS proje dosyası bulunamadı.');
    
    // Eğer 'ios' klasörü varsa ama proje dosyası yoksa, bu bir "zombi" klasördür. Silelim.
    if (fs.existsSync('ios')) {
        console.log('🧹 Bozuk/Eksik iOS klasörü temizleniyor...');
        try {
            fs.rmSync('ios', { recursive: true, force: true });
        } catch (e) {
            console.error('⚠️ Klasör silinemedi (Devam ediliyor):', e.message);
        }
    }

    console.log('✨ iOS platformu sıfırdan ekleniyor...');
    try {
      execSync('npx cap add ios', { stdio: 'inherit' });
    } catch (e) {
      console.error('❌ iOS eklenemedi:', e.message);
      process.exit(1); // Kritik hata, durdur.
    }
  } else {
      console.log('✅ iOS projesi mevcut.');
  }

  // 1.5 ADIM: Sync İşlemi (Önemli)
  // Platform eklendikten sonra veya zaten varsa, dist ve pluginleri senkronize etmeliyiz.
  // Bu adım Assets klasörünün oluşmasını garantiler.
  console.log('🔄 Capacitor Sync çalıştırılıyor...');
  try {
      execSync('npx cap sync ios', { stdio: 'inherit' });
  } catch (e) {
      console.warn('⚠️ Sync uyarısı:', e.message);
  }

  // 2. ADIM: PROFESYONEL İKON OLUŞTURMA
  console.log('🎨 İkon durumu kontrol ediliyor...');
  const logoPath = 'assets/logo.png';
  
  // Sharp kurulumu
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('📦 Grafik motoru (sharp) yükleniyor...');
    try {
        execSync('npm install sharp --no-save', { stdio: 'inherit' });
        sharp = require('sharp');
    } catch (err) {
        console.warn('⚠️ Sharp yüklenemedi, varsayılan ikon kullanılacak.');
    }
  }

  // Logo kontrolü ve oluşturma
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
      try {
        const buffer = Buffer.from(iconSvg);
        await sharp(buffer).resize(1024, 1024).png().toFile(logoPath);
        console.log('✅ Yeni ikon oluşturuldu.');
      } catch (e) {
        console.error('İkon oluşturma hatası:', e);
      }
  }

  // 3. ADIM: İKON SETİ KLASÖRÜNÜ HAZIRLA
  const iosAssetDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  
  // Windows'ta kilitlenme sorunu için silme işlemi (Linux/Mac'te yapma)
  if (process.platform === 'win32' && fs.existsSync(iosAssetDir)) {
      try {
          fs.rmSync(iosAssetDir, { recursive: true, force: true });
          await new Promise(r => setTimeout(r, 1000));
      } catch (e) {}
  }

  // 4. ADIM: ASSET GENERATION
  console.log('🚀 İkon setleri üretiliyor...');
  try {
      execSync('npx capacitor-assets generate --ios', { stdio: 'inherit' });
  } catch (e) {
      console.warn('⚠️ Otomatik ikon üretimi başarısız oldu (Failsafe devreye girecek).');
  }

  // 5. ADIM: FAILSAFE (GÜVENLİK AĞI)
  // Appflow'da capacitor-assets bazen izin hatası verir, bu durumda manuel oluştururuz.
  if (!fs.existsSync(iosAssetDir) || fs.readdirSync(iosAssetDir).length < 2) {
      console.log('🛡️ Failsafe: AppIcon manuel olarak onarılıyor...');
      
      if (!fs.existsSync(iosAssetDir)) {
          fs.mkdirSync(iosAssetDir, { recursive: true });
      }

      const destIconPath = path.join(iosAssetDir, 'AppIcon-1024.png');
      if (fs.existsSync(logoPath)) {
          fs.copyFileSync(logoPath, destIconPath);
      }

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
      console.log('✅ Failsafe: AppIcon.appiconset oluşturuldu.');
  }

  // 6. ADIM: APP STORE VERSİYONLAMA VE İZİNLER
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      console.log('📝 Info.plist güncelleniyor...');
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      
      const date = new Date();
      // YYYYMMDDHHmm formatı (Örn: 202405201430)
      const buildVersion = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}${String(date.getHours()).padStart(2,'0')}${String(date.getMinutes()).padStart(2,'0')}`;
      
      // Versiyonu güncelle
      const regex = /(<key>CFBundleVersion<\/key>\s*<string>)([^<]+)(<\/string>)/;
      if (regex.test(content)) {
          content = content.replace(regex, `$1${buildVersion}$3`);
      } else {
          content = content.replace('<dict>', `<dict>\n<key>CFBundleVersion</key>\n<string>${buildVersion}</string>`);
      }
      
      // İzin Açıklamaları
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
           content = content.replace('<dict>', `<dict>
            <key>NSLocationWhenInUseUsageDescription</key>
            <string>Namaz vakitlerini hesaplamak için konumunuza ihtiyacımız var.</string>
            <key>NSLocationAlwaysUsageDescription</key>
            <string>Namaz vakitlerini hesaplamak için konumunuza ihtiyacımız var.</string>
            <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
            <string>Namaz vakitlerini hesaplamak için konumunuza ihtiyacımız var.</string>
            <key>ITSAppUsesNonExemptEncryption</key>
            <false/>
           `);
      }

      fs.writeFileSync(infoPlistPath, content);
  }
  
  // 7. ADIM: Podfile Fix (iOS 13.0+)
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

  console.log('✅ HAZIRLIK BAŞARIYLA TAMAMLANDI!');
}

main();
