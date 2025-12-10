const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🛠️ iOS Ortamı Hazırlanıyor (Final Fix) ---');

  // 0. ADIM: Gerekli Klasörleri Oluştur
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
    fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Placeholder</body></html>');
  }
  if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
  }

  // 1. ADIM: İKON KAYNAĞINI BELİRLE
  const possibleSources = ['icon.png', 'logo.png', 'assets/icon.png', 'assets/logo.png'];
  let sourceFound = false;
  
  // Sharp kurulumu (Eğer yoksa yükle)
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('📦 Grafik motoru (sharp) yükleniyor...');
    try {
        execSync('npm install sharp --no-save', { stdio: 'inherit' });
        sharp = require('sharp');
    } catch (err) {
        console.warn('⚠️ Sharp yüklenemedi, ikon üretimi atlanabilir.');
    }
  }

  // Kaynak resmi bul ve assets/logo.png olarak hazırla
  for (const src of possibleSources) {
      if (fs.existsSync(src)) {
          console.log(`📦 Kaynak resim bulundu: ${src}`);
          if (sharp) {
              try {
                  const buffer = fs.readFileSync(src);
                  // 1024x1024 boyutunda temiz bir PNG oluştur
                  await sharp(buffer).resize(1024, 1024).png().toFile('assets/logo.png');
                  sourceFound = true;
                  console.log('✅ Resim optimize edildi: assets/logo.png');
              } catch(e) {
                  console.error('❌ Resim işleme hatası:', e.message);
              }
          } else {
              // Sharp yoksa kopyala geç
              fs.copyFileSync(src, 'assets/logo.png');
              sourceFound = true;
          }
          break;
      }
  }

  // Resim yoksa varsayılan bir SVG'den ikon üret
  if (!sourceFound && sharp) {
      console.log('✨ Varsayılan ikon oluşturuluyor...');
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
        <text x="512" y="550" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="400" fill="#d4af37">N</text>
      </svg>
      `;
      try {
        await sharp(Buffer.from(iconSvg)).png().toFile('assets/logo.png');
      } catch (e) {
        console.warn('⚠️ Varsayılan ikon oluşturulamadı:', e.message);
      }
  }

  // 2. ADIM: iOS PLATFORMU EKSİKSE VEYA BOZUKSA EKLE
  const xcodeProjPath = 'ios/App/App.xcodeproj';
  if (!fs.existsSync(xcodeProjPath)) {
    if (fs.existsSync('ios')) {
        console.log('🧹 Bozuk iOS klasörü temizleniyor...');
        fs.rmSync('ios', { recursive: true, force: true });
    }
    console.log('✨ iOS platformu ekleniyor...');
    try {
        execSync('npx cap add ios', { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ iOS platformu eklenemedi:', e.message);
    }
  }

  // 3. ADIM: İKON SETİNİ OLUŞTUR (MANUEL GENERATION)
  // Capacitor Assets aracı yerine doğrudan Sharp kullanarak yapıyoruz ki hata olasılığı düşsün.
  console.log('🚀 İkon seti üretiliyor...');
  const iosAssetDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

  // Hedef klasörü sıfırla (Temiz kurulum)
  if (fs.existsSync(iosAssetDir)) {
      try {
        fs.rmSync(iosAssetDir, { recursive: true, force: true });
        // Dosya sistemi için kısa bekleme
        await new Promise(r => setTimeout(r, 500));
      } catch (e) { console.warn("Klasör temizleme uyarısı:", e.message); }
  }
  
  if (!fs.existsSync(iosAssetDir)) {
      fs.mkdirSync(iosAssetDir, { recursive: true });
  }

  if (sharp && fs.existsSync('assets/logo.png')) {
    try {
        const sourceBuffer = fs.readFileSync('assets/logo.png');
        
        // iOS için gerekli temel ikon boyutları
        // filename: Contents.json ile eşleşmeli
        const icons = [
            { size: 40, name: 'AppIcon-20x20@2x.png' },
            { size: 60, name: 'AppIcon-20x20@3x.png' },
            { size: 58, name: 'AppIcon-29x29@2x.png' },
            { size: 87, name: 'AppIcon-29x29@3x.png' },
            { size: 80, name: 'AppIcon-40x40@2x.png' },
            { size: 120, name: 'AppIcon-40x40@3x.png' },
            { size: 120, name: 'AppIcon-60x60@2x.png' },
            { size: 180, name: 'AppIcon-60x60@3x.png' },
            { size: 1024, name: 'AppIcon-512@2x.png' }
        ];

        // Tüm boyutları üret ve kaydet
        for (const icon of icons) {
            await sharp(sourceBuffer)
                .resize(icon.size, icon.size)
                .png()
                .toFile(path.join(iosAssetDir, icon.name));
        }

        // Contents.json oluştur (Xcode için harita)
        const contents = {
            "images": [
                { "size": "20x20", "idiom": "iphone", "filename": "AppIcon-20x20@2x.png", "scale": "2x" },
                { "size": "20x20", "idiom": "iphone", "filename": "AppIcon-20x20@3x.png", "scale": "3x" },
                { "size": "29x29", "idiom": "iphone", "filename": "AppIcon-29x29@2x.png", "scale": "2x" },
                { "size": "29x29", "idiom": "iphone", "filename": "AppIcon-29x29@3x.png", "scale": "3x" },
                { "size": "40x40", "idiom": "iphone", "filename": "AppIcon-40x40@2x.png", "scale": "2x" },
                { "size": "40x40", "idiom": "iphone", "filename": "AppIcon-40x40@3x.png", "scale": "3x" },
                { "size": "60x60", "idiom": "iphone", "filename": "AppIcon-60x60@2x.png", "scale": "2x" },
                { "size": "60x60", "idiom": "iphone", "filename": "AppIcon-60x60@3x.png", "scale": "3x" },
                { "size": "1024x1024", "idiom": "ios-marketing", "filename": "AppIcon-512@2x.png", "scale": "1x" }
            ],
            "info": {
                "version": 1,
                "author": "xcode"
            }
        };

        fs.writeFileSync(path.join(iosAssetDir, 'Contents.json'), JSON.stringify(contents, null, 2));
        console.log('✅ İkon seti başarıyla oluşturuldu.');

    } catch (e) {
        console.error('⚠️ İkon oluşturulurken hata:', e.message);
    }
  } else {
      console.warn('⚠️ Sharp modülü veya logo.png eksik, ikon oluşturma atlandı.');
  }

  // 4. ADIM: Info.plist GÜNCELLEMELERİ (Versiyon ve İzinler)
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      
      // Benzersiz Versiyon Numarası (TestFlight için kritik)
      const now = new Date();
      // Format: YYYYMMDDHHmm (Dakikaya kadar benzersiz)
      const buildVer = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      
      // CFBundleVersion değiştir
      if (!content.includes('CFBundleVersion')) {
          content = content.replace('<dict>', `<dict>\n<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);
      } else {
          content = content.replace(/<key>CFBundleVersion<\/key>[\s\r\n]*<string>[^<]+<\/string>/, `<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);
      }

      // Konum İzinleri
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
          content = content.replace('<dict>', `<dict>
            <key>NSLocationWhenInUseUsageDescription</key>
            <string>Namaz vakitlerini hesaplamak ve kıbleyi bulmak için konumunuza ihtiyacımız var.</string>
            <key>NSLocationAlwaysUsageDescription</key>
            <string>Namaz vakitlerini hesaplamak için konumunuza ihtiyacımız var.</string>
          `);
      }
      
      fs.writeFileSync(infoPlistPath, content);
      console.log(`✅ Info.plist güncellendi (Build: ${buildVer})`);
  }

  // 5. ADIM: Podfile Düzenlemesi (iOS Sürümü)
  const podfile = 'ios/App/Podfile';
  if (fs.existsSync(podfile)) {
      let pContent = fs.readFileSync(podfile, 'utf8');
      if (!pContent.includes("platform :ios, '13.0'")) {
          pContent = "platform :ios, '13.0'\n" + pContent.replace(/platform :ios, .*/, '');
          fs.writeFileSync(podfile, pContent);
          console.log('✅ Podfile iOS 13.0 olarak ayarlandı.');
      }
  }

  console.log('🎉 Hazırlık tamamlandı.');
}

main();