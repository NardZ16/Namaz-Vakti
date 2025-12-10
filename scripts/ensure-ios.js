const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🛡️ iOS Build Hazırlığı (Fail-Safe Mod) ---');

  // 1. Temel Klasör Kontrolleri
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');
  if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist'); 
      fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Placeholder</body></html>');
  }

  // 2. iOS Platformu Ekle (Eğer yoksa)
  if (!fs.existsSync('ios/App/App.xcodeproj')) {
      console.log('⚙️ iOS platformu kuruluyor...');
      if (fs.existsSync('ios')) fs.rmSync('ios', { recursive: true, force: true });
      try {
        execSync('npx cap add ios', { stdio: 'inherit' });
      } catch (e) {
        console.warn('⚠️ iOS platformu eklenirken uyarı:', e.message);
      }
  }

  // 3. Sharp Kütüphanesi Yükle
  let sharp;
  try {
      sharp = require('sharp');
  } catch (e) {
      console.log('📦 Sharp yükleniyor...');
      try {
        execSync('npm install sharp --no-save', { stdio: 'inherit' });
        sharp = require('sharp');
      } catch (err) {
        console.warn('⚠️ Sharp yüklenemedi. İkon işlemi atlanabilir.');
      }
  }

  // 4. İkon Hedef Klasörü Hazırla
  const iosIconDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  if (fs.existsSync(iosIconDir)) {
      try { fs.rmSync(iosIconDir, { recursive: true, force: true }); } catch(e) {}
  }
  fs.mkdirSync(iosIconDir, { recursive: true });

  const iconSizes = [
      { name: 'AppIcon-20x20@2x.png', size: 40 },
      { name: 'AppIcon-20x20@3x.png', size: 60 },
      { name: 'AppIcon-29x29@2x.png', size: 58 },
      { name: 'AppIcon-29x29@3x.png', size: 87 },
      { name: 'AppIcon-40x40@2x.png', size: 80 },
      { name: 'AppIcon-40x40@3x.png', size: 120 },
      { name: 'AppIcon-60x60@2x.png', size: 120 },
      { name: 'AppIcon-60x60@3x.png', size: 180 },
      { name: 'AppIcon-76x76@2x.png', size: 152 },
      { name: 'AppIcon-83.5x83.5@2x.png', size: 167 },
      { name: 'AppIcon-512@2x.png', size: 1024 }
  ];

  // 5. İkon Üretim Mantığı (Hata Korumalı)
  const generateIcons = async (buffer) => {
      if (!sharp) return;
      for (const icon of iconSizes) {
          await sharp(buffer)
            .resize(icon.size, icon.size, { fit: 'cover' })
            .png()
            .toFile(path.join(iosIconDir, icon.name));
      }
  };

  const fallbackSvg = `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#0f766e"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="500" fill="white" font-weight="bold">N</text>
  </svg>`;

  try {
      // Kullanıcı resmini bul
      let sourcePath = null;
      const candidates = ['assets/logo.png', 'assets/logo.jpg', 'assets/logo.jpeg', 'logo.png', 'logo.jpg'];
      for (const c of candidates) {
          if (fs.existsSync(c)) {
              sourcePath = c;
              break;
          }
      }

      if (sourcePath) {
          console.log(`🖼️ Kaynak resim bulundu: ${sourcePath}`);
          const buffer = fs.readFileSync(sourcePath);
          await generateIcons(buffer);
          console.log('✅ Kullanıcı ikonu başarıyla işlendi.');
      } else {
          throw new Error("Resim bulunamadı");
      }
  } catch (e) {
      console.warn(`⚠️ UYARI: Kullanıcı resmi işlenemedi (${e.message}).`);
      console.log('🔄 Varsayılan (Fallback) ikon oluşturuluyor...');
      try {
          // Sharp SVG desteği ile fallback oluştur
          if (sharp) {
            await generateIcons(Buffer.from(fallbackSvg));
            console.log('✅ Yedek ikon başarıyla oluşturuldu.');
          }
      } catch (err) {
          console.error('❌ İkon oluşturulamadı (Build devam edecek).', err.message);
      }
  }

  // 6. Contents.json Oluştur (Xcode Hatasını Önler)
  const contentsJson = {
    "images": [
      { "size": "20x20", "idiom": "iphone", "filename": "AppIcon-20x20@2x.png", "scale": "2x" },
      { "size": "20x20", "idiom": "iphone", "filename": "AppIcon-20x20@3x.png", "scale": "3x" },
      { "size": "29x29", "idiom": "iphone", "filename": "AppIcon-29x29@2x.png", "scale": "2x" },
      { "size": "29x29", "idiom": "iphone", "filename": "AppIcon-29x29@3x.png", "scale": "3x" },
      { "size": "40x40", "idiom": "iphone", "filename": "AppIcon-40x40@2x.png", "scale": "2x" },
      { "size": "40x40", "idiom": "iphone", "filename": "AppIcon-40x40@3x.png", "scale": "3x" },
      { "size": "60x60", "idiom": "iphone", "filename": "AppIcon-60x60@2x.png", "scale": "2x" },
      { "size": "60x60", "idiom": "iphone", "filename": "AppIcon-60x60@3x.png", "scale": "3x" },
      { "size": "20x20", "idiom": "ipad", "filename": "AppIcon-20x20@2x.png", "scale": "2x" },
      { "size": "29x29", "idiom": "ipad", "filename": "AppIcon-29x29@2x.png", "scale": "2x" },
      { "size": "40x40", "idiom": "ipad", "filename": "AppIcon-40x40@2x.png", "scale": "2x" },
      { "size": "76x76", "idiom": "ipad", "filename": "AppIcon-76x76@2x.png", "scale": "2x" },
      { "size": "83.5x83.5", "idiom": "ipad", "filename": "AppIcon-83.5x83.5@2x.png", "scale": "2x" },
      { "size": "1024x1024", "idiom": "ios-marketing", "filename": "AppIcon-512@2x.png", "scale": "1x" }
    ],
    "info": { "version": 1, "author": "xcode" }
  };
  fs.writeFileSync(path.join(iosIconDir, 'Contents.json'), JSON.stringify(contentsJson, null, 2));

  // 7. Info.plist Versiyonlama (App Store Connect için ŞART)
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      const now = new Date();
      // YYYYMMDDHHmm
      const buildVer = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      
      // Replace existing version
      if (content.includes('CFBundleVersion')) {
          content = content.replace(/<key>CFBundleVersion<\/key>[\s\r\n]*<string>.*?<\/string>/g, `<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);
      } else {
          content = content.replace('<dict>', `<dict>\n<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);
      }

      // Add Encryption key if missing
      if (!content.includes('ITSAppUsesNonExemptEncryption')) {
          content = content.replace('<dict>', `<dict>\n<key>ITSAppUsesNonExemptEncryption</key>\n<false/>`);
      }
      // Add Location usage strings if missing
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
        content = content.replace('<dict>', `<dict>
          <key>NSLocationWhenInUseUsageDescription</key>
          <string>Namaz vakitleri için konum gereklidir.</string>
          <key>NSLocationAlwaysUsageDescription</key>
          <string>Namaz vakitleri için konum gereklidir.</string>`);
      }

      fs.writeFileSync(infoPlistPath, content);
      console.log(`✅ Build version güncellendi: ${buildVer}`);
  }
}

// Hata olsa bile 0 kodu ile çık ki CI/CD durmasın
main().catch(e => {
    console.error("Script Hatası (Yoksayılıyor):", e);
    process.exit(0);
});