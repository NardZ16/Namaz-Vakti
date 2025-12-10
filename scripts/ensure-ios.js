const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🎨 iOS İkon Değiştirici (Manuel & Kesin Mod) ---');

  // 1. Önce assets klasörünü kontrol et
  if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
    console.log('⚠️ Assets klasörü yoktu, oluşturuldu. Lütfen içine logo.png koyun!');
  }

  // 2. Kaynak Dosyayı Belirle (Sadece assets klasörüne bakar)
  let sourcePath = null;
  if (fs.existsSync('assets/logo.png')) sourcePath = 'assets/logo.png';
  else if (fs.existsSync('assets/logo.jpg')) sourcePath = 'assets/logo.jpg';
  else if (fs.existsSync('assets/logo.jpeg')) sourcePath = 'assets/logo.jpeg';

  // Eğer kullanıcı dosya koymamışsa, uyarı ver ve varsayılan oluştur
  let sharp;
  try {
      sharp = require('sharp');
  } catch (e) {
      console.log('📦 Sharp yükleniyor...');
      execSync('npm install sharp --no-save', { stdio: 'inherit' });
      sharp = require('sharp');
  }

  if (!sourcePath) {
      console.warn('⚠️ UYARI: "assets/logo.png" bulunamadı! Varsayılan yeşil ikon oluşturuluyor...');
      const defaultSvg = `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="#0f766e"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="500" fill="white" font-weight="bold">N</text>
      </svg>`;
      sourcePath = 'assets/logo.png';
      await sharp(Buffer.from(defaultSvg)).png().toFile(sourcePath);
  }

  console.log(`✅ Kaynak dosya: ${sourcePath} (Bu dosya ikon olacak)`);

  // 3. iOS Klasörü Hazırlığı
  // Eğer iOS klasörü yoksa veya proje dosyası bozuksa sıfırdan ekle
  if (!fs.existsSync('ios/App/App.xcodeproj')) {
      console.log('⚙️ iOS platformu kuruluyor...');
      if (fs.existsSync('ios')) fs.rmSync('ios', { recursive: true, force: true });
      execSync('npx cap add ios', { stdio: 'inherit' });
  }

  // 4. İkonları Manuel Olarak Oluştur (Kesin Çözüm)
  console.log('🚀 İkonlar işleniyor ve yerine yerleştiriliyor...');
  
  const iosIconDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  
  // Hedef klasörü temizle (Eski ikon kalmasın)
  if (fs.existsSync(iosIconDir)) {
      fs.rmSync(iosIconDir, { recursive: true, force: true });
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
      { name: 'AppIcon-512@2x.png', size: 1024 } // App Store İkonu
  ];

  const sourceBuffer = fs.readFileSync(sourcePath);

  // Tek tek boyutlandırıp kaydet
  for (const icon of iconSizes) {
      await sharp(sourceBuffer)
        .resize(icon.size, icon.size, { fit: 'cover' })
        .png()
        .toFile(path.join(iosIconDir, icon.name));
  }

  // Contents.json dosyasını yaz (Xcode'un haritası)
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
  console.log('✨ İkonlar başarıyla değiştirildi!');

  // 5. Build Numarası ve İzinler (App Store için ŞART)
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      
      const now = new Date();
      const buildVer = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      
      content = content.replace(/<key>CFBundleVersion<\/key>[\s\r\n]*<string>.*?<\/string>/g, '');
      content = content.replace('<dict>', `<dict>\n<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);

      if (!content.includes('ITSAppUsesNonExemptEncryption')) {
          content = content.replace('<dict>', `<dict>\n<key>ITSAppUsesNonExemptEncryption</key>\n<false/>`);
      }
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
        content = content.replace('<dict>', `<dict>
          <key>NSLocationWhenInUseUsageDescription</key>
          <string>Namaz vakitleri için konum gereklidir.</string>
          <key>NSLocationAlwaysUsageDescription</key>
          <string>Namaz vakitleri için konum gereklidir.</string>`);
    }

      fs.writeFileSync(infoPlistPath, content);
      console.log(`✅ Build numarası güncellendi: ${buildVer}`);
  }

  // 6. Eşitle
  try { execSync('npx cap sync ios', { stdio: 'inherit' }); } catch(e) {}
}

main();