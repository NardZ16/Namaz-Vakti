const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🛠️ iOS Ortamı Hazırlanıyor (App Store Fix) ---');

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
  
  // Sharp kurulumu
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('📦 Grafik motoru (sharp) kontrol ediliyor...');
    try {
        execSync('npm install sharp --no-save', { stdio: 'inherit' });
        sharp = require('sharp');
    } catch (err) {
        console.warn('⚠️ Sharp yüklenemedi. İkonlar kopyalama yöntemiyle oluşturulacak.');
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
        <rect width="1024" height="1024" fill="#0f766e"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="400" fill="white" font-weight="bold">N</text>
      </svg>
      `;
      try {
        await sharp(Buffer.from(iconSvg)).png().toFile('assets/logo.png');
      } catch (e) {}
  }

  // 2. ADIM: iOS PLATFORMU EKSİKSE VEYA BOZUKSA EKLE
  const xcodeProjPath = path.join('ios', 'App', 'App.xcodeproj');
  
  // Eğer ios klasörü var ama proje dosyası yoksa (CI hatası), sil ve temizle
  if (fs.existsSync('ios') && !fs.existsSync(xcodeProjPath)) {
      console.log('🧹 Bozuk iOS klasörü temizleniyor...');
      try {
        fs.rmSync('ios', { recursive: true, force: true });
      } catch(e) { console.warn('Silme uyarısı:', e.message); }
  }

  if (!fs.existsSync('ios')) {
    console.log('✨ iOS platformu sıfırdan ekleniyor...');
    try {
        execSync('npx cap add ios', { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ iOS platformu eklenemedi:', e.message);
        // Devam etmeye çalışacağız
    }
  }

  // 3. ADIM: İKON SETİNİ OLUŞTUR (MANUEL GENERATION)
  console.log('🚀 İkon seti işleniyor...');
  const iosAssetDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

  // Klasör yoksa oluştur
  if (!fs.existsSync(iosAssetDir)) {
      fs.mkdirSync(iosAssetDir, { recursive: true });
  }

  // İkon boyutları
  if (fs.existsSync('assets/logo.png')) {
    try {
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

        // Sharp varsa resize yap, yoksa kopyala
        if (sharp) {
            const sourceBuffer = fs.readFileSync('assets/logo.png');
            for (const icon of icons) {
                await sharp(sourceBuffer)
                    .resize(icon.size, icon.size)
                    .png()
                    .toFile(path.join(iosAssetDir, icon.name));
            }
        } else {
            // Fallback
            for (const icon of icons) {
                fs.copyFileSync('assets/logo.png', path.join(iosAssetDir, icon.name));
            }
        }

        // Contents.json (Kesinlikle olmalı)
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
        console.log('✅ İkon seti başarıyla güncellendi.');

    } catch (e) {
        console.error('⚠️ İkon hatası:', e.message);
    }
  }

  // 4. ADIM: Info.plist GÜNCELLEMELERİ
  // Bu adım App Store görünürlüğü için KRİTİK
  const infoPlistPath = path.join('ios', 'App', 'App', 'Info.plist');
  if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      
      // Benzersiz Versiyon Numarası (YYYYMMDDHHmm)
      const now = new Date();
      const buildVer = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      
      // Versiyon numarasını güncelle
      if (content.includes('CFBundleVersion')) {
          content = content.replace(/(<key>CFBundleVersion<\/key>[\s\r\n]*<string>)([^<]+)(<\/string>)/, `$1${buildVer}$3`);
      } else {
          content = content.replace('<dict>', `<dict>\n<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);
      }

      // Şifreleme Bildirimi (App Store'da hemen görünmesi için ŞART)
      if (!content.includes('ITSAppUsesNonExemptEncryption')) {
          content = content.replace('<dict>', `<dict>
            <key>ITSAppUsesNonExemptEncryption</key>
            <false/>
          `);
      }

      // Konum İzinleri
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
          content = content.replace('<dict>', `<dict>
            <key>NSLocationWhenInUseUsageDescription</key>
            <string>Namaz vakitleri için konum gereklidir.</string>
            <key>NSLocationAlwaysUsageDescription</key>
            <string>Namaz vakitleri için konum gereklidir.</string>
          `);
      }
      
      fs.writeFileSync(infoPlistPath, content);
      console.log(`✅ Info.plist güncellendi. Build No: ${buildVer}`);
  }

  // 5. ADIM: SON SENKRONİZASYON
  console.log('🔄 Native projeye eşitleniyor...');
  try {
      execSync('npx cap sync ios', { stdio: 'inherit' });
  } catch (e) {
      console.warn('Sync uyarısı:', e.message);
  }

  console.log('🎉 İŞLEM TAMAMLANDI.');
}

main();
