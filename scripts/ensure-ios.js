const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🍎 iOS Build Hazırlığı (Robust Mod) ---');

  // 1. iOS Platform Kontrolü
  // App.xcodeproj yoksa platformu sıfırdan kur
  if (!fs.existsSync('ios/App/App.xcodeproj')) {
    console.log('✨ iOS platformu ekleniyor...');
    if (fs.existsSync('ios')) {
        try {
            fs.rmSync('ios', { recursive: true, force: true });
        } catch(e) { console.warn("iOS klasörü silinemedi:", e.message); }
    }
    try {
        execSync('npx cap add ios', { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ iOS platformu eklenemedi:', e.message);
    }
  }

  // 2. Kaynak Resim Hazırlığı (assets/logo.png)
  // Kaynak ne olursa olsun (jpg, png, bozuk) temiz bir PNG oluştur.
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');

  const potentialFiles = [
    'icon.png', 'icon.jpg', 'icon.jpeg',
    'logo.png', 'logo.jpg', 'logo.jpeg',
    'assets/icon.png', 'assets/icon.jpg',
    'assets/logo.png', 'assets/logo.jpg'
  ];

  let sourceFile = null;
  for (const f of potentialFiles) {
    if (fs.existsSync(f)) {
      sourceFile = f;
      break;
    }
  }

  let sharp;
  try {
      sharp = require('sharp');
  } catch (e) {
      console.warn('⚠️ Sharp modülü bulunamadı. npm install çalıştırılıyor...');
      try {
          execSync('npm install sharp --no-save', { stdio: 'inherit' });
          sharp = require('sharp');
      } catch (err) {
          console.error('❌ Sharp yüklenemedi.');
      }
  }

  if (sourceFile && sharp) {
      console.log(`📦 Kaynak resim işleniyor: ${sourceFile}`);
      try {
          const inputBuffer = fs.readFileSync(sourceFile);
          await sharp(inputBuffer)
            .resize(1024, 1024, { fit: 'cover' })
            .png()
            .toFile('assets/logo.png');
          console.log('✅ assets/logo.png onarıldı ve hazırlandı.');
      } catch (e) {
          console.warn('⚠️ Resim işleme hatası:', e.message);
          // Fallback: Kopyala
          if (sourceFile !== 'assets/logo.png') fs.copyFileSync(sourceFile, 'assets/logo.png');
      }
  } else if (!fs.existsSync('assets/logo.png') && sharp) {
      // Hiç resim yoksa varsayılan oluştur
      console.log('✨ Varsayılan ikon oluşturuluyor...');
      const svg = `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="#0f766e"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="500" fill="white" font-weight="bold">N</text>
      </svg>`;
      await sharp(Buffer.from(svg)).png().toFile('assets/logo.png');
  }

  // 3. İKON ÜRETİMİ (Failsafe Mekanizması)
  console.log('🚀 İkon setleri kontrol ediliyor...');
  const iosAssetDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  
  // Klasör yoksa oluştur
  if (!fs.existsSync(iosAssetDir)) {
      fs.mkdirSync(iosAssetDir, { recursive: true });
  }

  let generationSuccess = false;

  // YÖNTEM A: Otomatik Araç (Capacitor Assets)
  try {
      console.log('👉 Yöntem A: Capacitor Assets Aracı deneniyor...');
      execSync('npx capacitor-assets generate --ios', { stdio: 'pipe' }); // Pipe stdio to avoid clutter if it fails silently
      
      // Kontrol et: Contents.json oluştu mu?
      if (fs.existsSync(path.join(iosAssetDir, 'Contents.json'))) {
          console.log('✅ Capacitor Assets başarıyla çalıştı.');
          generationSuccess = true;
      } else {
          throw new Error('Araç çalıştı ama Contents.json oluşmadı.');
      }
  } catch (e) {
      console.warn(`⚠️ Otomatik araç başarısız oldu (${e.message}).`);
      console.log('👉 Yöntem B: Manuel "Failsafe" modu devreye giriyor...');
  }

  // YÖNTEM B: Manuel Üretim (Failsafe)
  // Eğer Yöntem A başarısız olduysa veya Contents.json yoksa
  if (!generationSuccess && sharp && fs.existsSync('assets/logo.png')) {
      try {
        const sourceBuffer = fs.readFileSync('assets/logo.png');
        
        // Gerekli dosyalar ve boyutları
        const icons = [
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

        // Dosyaları oluştur
        for (const icon of icons) {
            await sharp(sourceBuffer)
                .resize(icon.size, icon.size)
                .png()
                .toFile(path.join(iosAssetDir, icon.name));
        }

        // Contents.json oluştur
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
                { "size": "20x20", "idiom": "ipad", "filename": "AppIcon-20x20@2x.png", "scale": "2x" },
                { "size": "29x29", "idiom": "ipad", "filename": "AppIcon-29x29@2x.png", "scale": "2x" },
                { "size": "40x40", "idiom": "ipad", "filename": "AppIcon-40x40@2x.png", "scale": "2x" },
                { "size": "76x76", "idiom": "ipad", "filename": "AppIcon-76x76@2x.png", "scale": "2x" },
                { "size": "83.5x83.5", "idiom": "ipad", "filename": "AppIcon-83.5x83.5@2x.png", "scale": "2x" },
                { "size": "1024x1024", "idiom": "ios-marketing", "filename": "AppIcon-512@2x.png", "scale": "1x" }
            ],
            "info": { "version": 1, "author": "xcode" }
        };

        fs.writeFileSync(path.join(iosAssetDir, 'Contents.json'), JSON.stringify(contents, null, 2));
        console.log('✅ Manuel üretim (Failsafe) başarıyla tamamlandı.');

      } catch (e) {
          console.error('❌ Manuel üretim hatası:', e.message);
      }
  }

  // 4. Info.plist ve Versiyonlama
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      
      const now = new Date();
      const buildVer = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      
      // Version Code
      content = content.replace(/<key>CFBundleVersion<\/key>[\s\r\n]*<string>.*?<\/string>/g, '');
      content = content.replace('<dict>', `<dict>\n<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);

      // Encryption
      if (!content.includes('ITSAppUsesNonExemptEncryption')) {
          content = content.replace('<dict>', `<dict>\n<key>ITSAppUsesNonExemptEncryption</key>\n<false/>`);
      }

      // Locations
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
          content = content.replace('<dict>', `<dict>
            <key>NSLocationWhenInUseUsageDescription</key>
            <string>Namaz vakitlerini hesaplamak için konum gereklidir.</string>
            <key>NSLocationAlwaysUsageDescription</key>
            <string>Namaz vakitlerini hesaplamak için konum gereklidir.</string>`);
      }

      fs.writeFileSync(infoPlistPath, content);
      console.log(`✅ Info.plist güncellendi (Build: ${buildVer})`);
  }

  // 5. Final Sync
  try {
    execSync('npx cap sync ios', { stdio: 'inherit' });
  } catch (e) {
    console.warn('Sync uyarısı:', e.message);
  }
}

main();
