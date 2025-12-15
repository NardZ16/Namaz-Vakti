
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const https = require('https');

// 👇👇👇 İKON AYARI - BURAYA RESİM LİNKİNİZİ YAPIŞTIRIN 👇👇👇
const ICON_URL = "https://i.hizliresim.com/dn9sac4.png"; 
// 👆👆👆 ----------------------------------------------- 👆👆👆

// Resmi indirme fonksiyonu
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            // Yönlendirme (Redirect) varsa takip et
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

// 🚑 AdMob Plugin Patch Fonksiyonu
function patchAdMobFiles() {
    const potentialPaths = [
        path.join('node_modules', '@capacitor-community', 'admob', 'ios', 'Sources', 'AdMobPlugin'),
        path.join('node_modules', '@capacitor-community', 'admob', 'ios', 'Plugin')
    ];

    let basePath = potentialPaths.find(p => fs.existsSync(p));
    
    if (!basePath) {
        console.warn("⚠️ AdMob plugin klasörü bulunamadı (npm install gerekli olabilir).");
        return;
    }
    
    console.log(`📍 AdMob Plugin bulundu: ${basePath}`);

    // 1. PATCH: ConsentExecutor.swift
    const consentPath = path.join(basePath, 'Consent', 'ConsentExecutor.swift');
    if (fs.existsSync(consentPath)) {
        let content = fs.readFileSync(consentPath, 'utf8');
        
        // Önceki yamalardan kalan olası hataları temizle
        if (content.includes('load(withCompletionHandler:')) {
             content = content.replace(/load\(withCompletionHandler:/g, 'load(with:');
        }
        if (content.includes('load(completionHandler:')) {
             content = content.replace(/load\(completionHandler:/g, 'load(with:');
        }

        const replacements = [
            { old: /UMPConsentStatus/g, new: 'ConsentStatus' },
            { old: /UMPRequestParameters/g, new: 'RequestParameters' },
            { old: /UMPDebugSettings/g, new: 'DebugSettings' },
            { old: /UMPDebugGeography/g, new: 'DebugGeography' },
            { old: /UMPConsentInformation/g, new: 'ConsentInformation' },
            { old: /UMPConsentForm/g, new: 'ConsentForm' },
            { old: /UMPFormStatus/g, new: 'FormStatus' },
            { old: /\.sharedInstance/g, new: '.shared' },
            { old: /\.tagForUnderAgeOfConsent/g, new: '.isTaggedForUnderAgeOfConsent' },
            // Garanti olması için tekrar regex ile kontrol
            { old: /\.load\s*\(\s*completionHandler\s*:/g, new: '.load(with:' },
            { old: /\.load\s*\(\s*withCompletionHandler\s*:/g, new: '.load(with:' }
        ];

        let modified = false;
        replacements.forEach(rep => {
            if (rep.old.test(content)) {
                content = content.replace(rep.old, rep.new);
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(consentPath, content);
            console.log("✅ ConsentExecutor.swift: Parametreler 'load(with:)' olarak güncellendi.");
        }
    }

    // 2. PATCH: BannerExecutor.swift
    const bannerPath = path.join(basePath, 'Banner', 'BannerExecutor.swift');
    if (fs.existsSync(bannerPath)) {
        let content = fs.readFileSync(bannerPath, 'utf8');
        if (content.includes('kGADAdSizeSmartBannerPortrait')) {
            content = content.replace(/kGADAdSizeSmartBannerPortrait/g, 'GADPortraitAnchoredAdaptiveBannerAdSizeWithWidth(UIScreen.main.bounds.size.width)');
            fs.writeFileSync(bannerPath, content);
            console.log("✅ BannerExecutor.swift: Smart Banner güncellendi.");
        }
    }
}

async function main() {
  console.log('--- 📱 iOS Build Hazırlığı (Online İkon Modu) ---');

  // Yama uygula
  patchAdMobFiles();

  // Klasörleri hazırla
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');
  if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist'); 
      fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Hazırlanıyor...</body></html>');
  }

  // iOS Platformunu Kontrol Et
  if (!fs.existsSync('ios/App/App.xcodeproj')) {
      console.log('⚙️ iOS platformu ekleniyor...');
      try {
        execSync('npx cap add ios', { stdio: 'inherit' });
      } catch (e) {
        console.warn('⚠️ Platform ekleme uyarısı:', e.message);
      }
      patchAdMobFiles(); // Yeni dosyalar için tekrar yama
  }

  // Sharp Modülünü Yükle (Resim işleme için zorunlu)
  let sharp;
  try {
      sharp = require('sharp');
  } catch (e) {
      console.log('📦 İkon işleme için Sharp modülü yükleniyor...');
      try {
        execSync('npm install sharp --no-save', { stdio: 'inherit' });
        sharp = require('sharp');
      } catch (err) {
        console.warn('⚠️ Sharp yüklenemedi. İkonlar varsayılan kalacak.');
      }
  }

  // İkon Oluşturma Süreci
  if (sharp) {
      console.log(`🎨 İkon işlemi başlatılıyor... Kaynak: ${ICON_URL}`);
      const iosIconDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
      
      // Temizle ve yeniden oluştur
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
          // İndirilen resmi önce 1024x1024 yap, arka planı doldur
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

      try {
          // LİNKTEN İNDİRME İŞLEMİ
          console.log(`🌍 Resim indiriliyor...`);
          const downloadedBuffer = await downloadImage(ICON_URL);
          await generateIcons(downloadedBuffer);
          console.log("✅ İkonlar linkten başarıyla oluşturuldu.");
          
          // Contents.json oluştur
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

      } catch (err) {
          console.error(`❌ İkon indirme hatası: ${err.message}. Varsayılan kullanılacak.`);
      }
  }

  // Info.plist Ayarları
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      const now = new Date();
      const buildVer = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      
      // Versiyon Güncelleme
      content = content.replace(/<key>CFBundleVersion<\/key>[\s\r\n]*<string>.*?<\/string>/g, `<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);
      
      // AdMob ID
      if (!content.includes('GADApplicationIdentifier')) {
        content = content.replace('<dict>', `<dict>
            <key>GADApplicationIdentifier</key>
            <string>ca-app-pub-4319080566007267~4413348107</string>`);
      }
      
      // Konum İzinleri
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
          content = content.replace('<dict>', `<dict>
            <key>NSLocationWhenInUseUsageDescription</key>
            <string>Namaz vakitleri için konum gereklidir.</string>`);
      }

      fs.writeFileSync(infoPlistPath, content);
  }

  // Podfile Temizliği
  const podfilePath = path.join('ios', 'App', 'Podfile');
  if (fs.existsSync(podfilePath)) {
      let podContent = fs.readFileSync(podfilePath, 'utf8');
      // Eski versiyon kısıtlamalarını kaldır
      podContent = podContent.replace(/platform :ios, .*/, "platform :ios, '13.0'");
      fs.writeFileSync(podfilePath, podContent);
  }
}

main().catch(e => {
    console.error("Script Hatası:", e);
    process.exit(1);
});
