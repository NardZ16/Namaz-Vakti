
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const https = require('https');

// 👇👇👇 İKON AYARI 👇👇👇
const ICON_URL = "https://i.hizliresim.com/sgt99br.png"; 
// 👆👆👆 ---------------- 👆👆👆

async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadImage(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Link hatası: ${res.statusCode}`));
                return;
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', (err) => reject(err));
    });
}

async function main() {
  console.log('--- 📱 iOS Build Hazırlığı (iPhone Only Modu) ---');

  // 1. Temel Klasör Kontrolleri
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');
  if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist'); 
      fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Placeholder</body></html>');
  }

  // 2. iOS Platformu Ekle
  if (!fs.existsSync('ios/App/App.xcodeproj')) {
      console.log('⚙️ iOS platformu kuruluyor...');
      if (fs.existsSync('ios')) fs.rmSync('ios', { recursive: true, force: true });
      try {
        execSync('npx cap add ios', { stdio: 'inherit' });
      } catch (e) {
        console.warn('⚠️ iOS platformu eklenirken uyarı:', e.message);
      }
  }

  // 3. Sharp Yükle
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

  const generateIcons = async (buffer) => {
      if (!sharp) return;
      const cleanBuffer = await sharp(buffer)
          .resize(1024, 1024, { fit: 'contain', background: { r: 15, g: 118, b: 110, alpha: 1 } })
          .flatten({ background: { r: 15, g: 118, b: 110 } })
          .png()
          .toBuffer();

      for (const icon of iconSizes) {
          await sharp(cleanBuffer)
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

  // 5. RESİM İŞLEME MANTIĞI
  let processed = false;
  if (sharp && ICON_URL && ICON_URL.startsWith('http')) {
      try {
          console.log(`🌍 Resim indiriliyor: ${ICON_URL}`);
          const downloadedBuffer = await downloadImage(ICON_URL);
          await generateIcons(downloadedBuffer);
          console.log('✅ Online resim indirildi ve ikon yapıldı.');
          processed = true;
      } catch (err) {
          console.warn(`⚠️ Online resim indirilemedi: ${err.message}.`);
      }
  }

  if (!processed && sharp) {
      console.log('🔄 Yedek (Fallback) ikon oluşturuluyor...');
      try {
          await generateIcons(Buffer.from(fallbackSvg));
          console.log('✅ Yedek ikon oluşturuldu.');
      } catch (e) {
          console.error('❌ İkon oluşturulamadı (Build devam edecek).', e.message);
      }
  }

  // 6. Contents.json Oluştur
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

  // 7. Info.plist Güncelleme
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      const now = new Date();
      const buildVer = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      
      // Build Version Güncelle
      if (content.includes('CFBundleVersion')) {
          content = content.replace(/<key>CFBundleVersion<\/key>[\s\r\n]*<string>.*?<\/string>/g, `<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);
      } else {
          content = content.replace('<dict>', `<dict>\n<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);
      }

      // Şifreleme İzni
      if (!content.includes('ITSAppUsesNonExemptEncryption')) {
          content = content.replace('<dict>', `<dict>\n<key>ITSAppUsesNonExemptEncryption</key>\n<false/>`);
      }

      // 🚨 ÖNEMLİ: Sadece iPhone (iPad Desteğini Kapatır)
      // UIDeviceFamily 1 = iPhone, 2 = iPad. Sadece 1 yaparak iPad zorunluluğunu kaldırıyoruz.
      if (content.includes('UIDeviceFamily')) {
        content = content.replace(
            /<key>UIDeviceFamily<\/key>[\s\S]*?<array>[\s\S]*?<\/array>/,
            `<key>UIDeviceFamily</key>\n\t<array>\n\t\t<integer>1</integer>\n\t</array>`
        );
      } else {
        content = content.replace('<dict>', `<dict>\n<key>UIDeviceFamily</key>\n<array>\n<integer>1</integer>\n</array>`);
      }

      // Konum İzinleri
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
          content = content.replace('<dict>', `<dict>
            <key>NSLocationWhenInUseUsageDescription</key>
            <string>Namaz vakitleri için konum gereklidir.</string>
            <key>NSLocationAlwaysUsageDescription</key>
            <string>Namaz vakitleri için konum gereklidir.</string>`);
      }

      // AdMob ID Ekleme (Info.plist'e GADApplicationIdentifier)
      if (!content.includes('GADApplicationIdentifier')) {
        content = content.replace('<dict>', `<dict>
            <key>GADApplicationIdentifier</key>
            <string>ca-app-pub-4319080566007267~4413348107</string>`);
      }
      // Not: SKAdNetworkItems reklam ağları için gerekebilir ama şimdilik ID yeterli.

      fs.writeFileSync(infoPlistPath, content);
      console.log(`✅ Ayarlar güncellendi: iPhone Only Modu, Build: ${buildVer}`);
  }

  // 8. Podfile Düzenleme (AdMob Sürüm Sabitleme)
  const podfilePath = path.join('ios', 'App', 'Podfile');
  if (fs.existsSync(podfilePath)) {
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');
      
      // Google-Mobile-Ads-SDK sürümünü 10.14.0'a sabitliyoruz.
      // v11.0.0+ sürümü UMP SDK'da breaking change (isim değişiklikleri) içeriyor.
      // Mevcut admob plugin'i eski isimlendirmeyi kullandığı için v10 serisinde kalmalıyız.
      if (!podfileContent.includes("Google-Mobile-Ads-SDK")) {
          console.log("🔧 Podfile: Google-Mobile-Ads-SDK sürümü 10.14.0'a sabitleniyor...");
          // 'target 'App' do' satırını bulup altına pod tanımını ekliyoruz
          podfileContent = podfileContent.replace(
              /target 'App' do/g, 
              "target 'App' do\n  pod 'Google-Mobile-Ads-SDK', '~> 10.14.0'"
          );
          fs.writeFileSync(podfilePath, podfileContent);
      }
  }

}

main().catch(e => {
    console.error("Script Hatası:", e);
    process.exit(0);
});
