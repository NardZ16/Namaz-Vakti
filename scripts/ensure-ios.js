
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const https = require('https');

// 👇👇👇 İKON AYARI 👇👇👇
const ICON_URL = "https://i.hizliresim.com/dn9sac4.png"; 
// 👆👆👆 ----------------- 👆👆👆

// Resmi indirme fonksiyonu
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (res) => {
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
        });
        request.on('error', (err) => reject(err));
    });
}

function patchAdMobFiles() {
    const potentialPaths = [
        path.join('node_modules', '@capacitor-community', 'admob', 'ios', 'Sources', 'AdMobPlugin'),
        path.join('node_modules', '@capacitor-community', 'admob', 'ios', 'Plugin')
    ];

    let basePath = potentialPaths.find(p => fs.existsSync(p));
    
    if (!basePath) {
        // console.warn("⚠️ AdMob plugin klasörü bulunamadı.");
        return;
    }
    
    // Patch logic...
    const consentPath = path.join(basePath, 'Consent', 'ConsentExecutor.swift');
    if (fs.existsSync(consentPath)) {
        let content = fs.readFileSync(consentPath, 'utf8');
        content = content.replace(/load\(withCompletionHandler:/g, 'load(with:')
                         .replace(/load\(completionHandler:/g, 'load(with:')
                         .replace(/UMPConsentStatus/g, 'ConsentStatus')
                         .replace(/UMPRequestParameters/g, 'RequestParameters')
                         .replace(/UMPDebugSettings/g, 'DebugSettings')
                         .replace(/UMPDebugGeography/g, 'DebugGeography')
                         .replace(/UMPConsentInformation/g, 'ConsentInformation')
                         .replace(/UMPConsentForm/g, 'ConsentForm')
                         .replace(/UMPFormStatus/g, 'FormStatus')
                         .replace(/\.sharedInstance/g, '.shared')
                         .replace(/\.tagForUnderAgeOfConsent/g, '.isTaggedForUnderAgeOfConsent');
        fs.writeFileSync(consentPath, content);
    }

    const bannerPath = path.join(basePath, 'Banner', 'BannerExecutor.swift');
    if (fs.existsSync(bannerPath)) {
        let content = fs.readFileSync(bannerPath, 'utf8');
        if (content.includes('kGADAdSizeSmartBannerPortrait')) {
            content = content.replace(/kGADAdSizeSmartBannerPortrait/g, 'GADPortraitAnchoredAdaptiveBannerAdSizeWithWidth(UIScreen.main.bounds.size.width)');
            fs.writeFileSync(bannerPath, content);
        }
    }
}

async function main() {
  console.log('🚀 Script Başlatılıyor (SIPS MODE)...');

  // 1. Web Klasörleri
  if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist'); 
      fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Hazırlanıyor...</body></html>');
  }
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');

  // 2. iOS Platform Kontrolü
  const xcodeprojPath = 'ios/App/App.xcodeproj';
  if (!fs.existsSync(xcodeprojPath)) {
      console.log('⚙️ iOS projesi oluşturuluyor...');
      if (fs.existsSync('ios')) try { fs.rmSync('ios', { recursive: true, force: true }); } catch(e) {}
      try {
        execSync('npx cap add ios', { stdio: 'inherit' });
      } catch (e) {
        console.error('❌ iOS platformu eklenemedi:', e.message);
      }
  }

  // 3. İKON İŞLEMLERİ (SIPS KULLANARAK)
  if (fs.existsSync(xcodeprojPath)) {
      console.log(`🎨 İkon indiriliyor ve işleniyor...`);
      try {
          const iosIconDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
          
          if (fs.existsSync(iosIconDir)) {
             try { fs.rmSync(iosIconDir, { recursive: true, force: true }); } catch(e) {}
          }
          fs.mkdirSync(iosIconDir, { recursive: true });

          // Resmi indir ve Master olarak kaydet
          const buffer = await downloadImage(ICON_URL);
          const masterPath = path.join(iosIconDir, 'master.png');
          fs.writeFileSync(masterPath, buffer);

          // Hedef Boyutlar (App Store Validation için kritik)
          const icons = [
            { name: 'AppIcon-20x20@2x.png', size: 40 },
            { name: 'AppIcon-20x20@3x.png', size: 60 },
            { name: 'AppIcon-29x29@2x.png', size: 58 },
            { name: 'AppIcon-29x29@3x.png', size: 87 },
            { name: 'AppIcon-40x40@2x.png', size: 80 },
            { name: 'AppIcon-40x40@3x.png', size: 120 }, // iPhone App Icon
            { name: 'AppIcon-60x60@2x.png', size: 120 }, // iPhone App Icon
            { name: 'AppIcon-60x60@3x.png', size: 180 },
            { name: 'AppIcon-76x76@2x.png', size: 152 }, // iPad App Icon
            { name: 'AppIcon-83.5x83.5@2x.png', size: 167 }, // iPad Pro App Icon
            { name: 'AppIcon-512@2x.png', size: 1024 }
          ];

          console.log("⚙️ 'sips' aracı ile yeniden boyutlandırılıyor...");
          
          for (const icon of icons) {
              const destPath = path.join(iosIconDir, icon.name);
              // macOS yerleşik resim işleme aracı: sips
              // -z [height] [width]
              try {
                  execSync(`sips -z ${icon.size} ${icon.size} "${masterPath}" --out "${destPath}"`, { stdio: 'ignore' });
              } catch (sipsErr) {
                  console.warn(`⚠️ Sips hatası (${icon.name}), kopyalama deneniyor...`);
                  fs.copyFileSync(masterPath, destPath);
              }
          }

          // Master dosyayı temizle
          try { fs.unlinkSync(masterPath); } catch(e) {}

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
          console.log("✅ İkonlar başarıyla oluşturuldu (Validasyon uyumlu).");
      } catch (err) {
          console.error("⚠️ İkon işlemi hatası:", err.message);
      }
  }

  // 4. Sync & Patch
  try {
      execSync('npx cap sync ios', { stdio: 'inherit' });
      patchAdMobFiles();
  } catch(e) {}

  // 5. Info.plist Versiyon & İzinler
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      const now = new Date();
      const buildVer = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      
      // Versiyon Güncelleme
      content = content.replace(/<key>CFBundleVersion<\/key>[\s\r\n]*<string>.*?<\/string>/g, `<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);
      
      // --- DİL AYARLARI (TÜRKÇE) ---
      // Development Region'ı 'tr' yap
      if (content.includes('CFBundleDevelopmentRegion')) {
         content = content.replace(/<key>CFBundleDevelopmentRegion<\/key>[\s\r\n]*<string>.*?<\/string>/g, `<key>CFBundleDevelopmentRegion</key>\n<string>tr</string>`);
      } else {
         content = content.replace('<dict>', `<dict>
            <key>CFBundleDevelopmentRegion</key>
            <string>tr</string>`);
      }

      // Localizations dizisine 'tr' ekle (Yoksa oluştur)
      if (!content.includes('CFBundleLocalizations')) {
         content = content.replace('<dict>', `<dict>
            <key>CFBundleLocalizations</key>
            <array>
                <string>tr</string>
            </array>`);
      }
      // -----------------------------

      if (!content.includes('GADApplicationIdentifier')) {
        content = content.replace('<dict>', `<dict>
            <key>GADApplicationIdentifier</key>
            <string>ca-app-pub-4319080566007267~4413348107</string>`);
      }
      
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
          content = content.replace('<dict>', `<dict>
            <key>NSLocationWhenInUseUsageDescription</key>
            <string>Namaz vakitleri için konum gereklidir.</string>`);
      }

      fs.writeFileSync(infoPlistPath, content);
  }

  // Podfile
  const podfilePath = path.join('ios', 'App', 'Podfile');
  if (fs.existsSync(podfilePath)) {
      let podContent = fs.readFileSync(podfilePath, 'utf8');
      podContent = podContent.replace(/platform :ios, .*/, "platform :ios, '13.0'");
      fs.writeFileSync(podfilePath, podContent);
  }

  console.log('🎉 Script tamamlandı.');
}

main().catch(e => {
    console.error("Beklenmeyen Hata:", e);
    process.exit(0);
});
