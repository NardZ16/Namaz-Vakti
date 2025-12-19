
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const https = require('https');

// 👇👇👇 İKON AYARI 👇👇👇
const ICON_URL = "https://i.hizliresim.com/dn7awmc.jpg"; 
// 👆👆👆 ----------------- 👆👆👆

// Paket versiyonunu oku
const packageJson = require('../package.json');
const APP_VERSION = packageJson.version; 

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

function patchAdMobFiles(basePathArg) {
    const potentialPaths = [
        path.join(basePathArg || '', 'node_modules', '@capacitor-community', 'admob', 'ios', 'Sources', 'AdMobPlugin'),
        path.join(basePathArg || '', 'node_modules', '@capacitor-community', 'admob', 'ios', 'Plugin')
    ];

    let basePath = potentialPaths.find(p => fs.existsSync(p));
    if (!basePath) return;
    
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
  const rootDir = path.resolve(__dirname, '..');
  const iosDir = path.join(rootDir, 'ios');
  const xcodeProj = path.join(iosDir, 'App', 'App.xcodeproj');

  console.log(`🚀 iOS Hazırlık Scripti Başlatılıyor (v${APP_VERSION})`);
  console.log(`📂 Çalışma Dizini: ${rootDir}`);

  // 1. Web Klasörleri Kontrolü (Capacitor için gerekli)
  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) {
      console.log('⚠️ dist klasörü bulunamadı, geçici olarak oluşturuluyor...');
      fs.mkdirSync(distDir, { recursive: true }); 
      fs.writeFileSync(path.join(distDir, 'index.html'), '<!DOCTYPE html><html><body>Building...</body></html>');
  }
  const assetsDir = path.join(rootDir, 'assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  // 2. iOS Platform Kontrolü ve Onarımı
  if (fs.existsSync(iosDir) && !fs.existsSync(xcodeProj)) {
      console.log('⚠️ iOS klasörü var ama proje dosyası eksik. Temizleniyor...');
      try {
        fs.rmSync(iosDir, { recursive: true, force: true });
      } catch (e) {
        console.error('❌ Klasör silinemedi:', e);
      }
  }

  if (!fs.existsSync(iosDir)) {
      console.log('⚙️ iOS platformu ekleniyor (npx cap add ios)...');
      try {
        execSync('npx cap add ios', { stdio: 'inherit', cwd: rootDir });
      } catch (e) {
        console.error('❌ iOS platformu eklenirken hata oluştu:', e.message);
        process.exit(1); 
      }
  } else {
      console.log('✅ iOS platformu mevcut.');
  }

  // --- SES DOSYASI KOPYALAMA (YENİ EKLENDİ) ---
  const soundFileSource = path.join(assetsDir, 'notification.wav');
  if (fs.existsSync(soundFileSource)) {
      console.log('🔊 notification.wav bulundu, native klasörlere kopyalanıyor...');
      
      // Android
      const androidRawDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res', 'raw');
      if (fs.existsSync(path.join(rootDir, 'android'))) {
          if (!fs.existsSync(androidRawDir)) fs.mkdirSync(androidRawDir, { recursive: true });
          fs.copyFileSync(soundFileSource, path.join(androidRawDir, 'notification.wav'));
          console.log('   ✅ Android (res/raw) kopyalandı.');
      }

      // iOS
      const iosAppDir = path.join(iosDir, 'App', 'App');
      if (fs.existsSync(iosAppDir)) {
          fs.copyFileSync(soundFileSource, path.join(iosAppDir, 'notification.wav'));
          console.log('   ✅ iOS (App/App) kopyalandı.');
      }
  } else {
      console.log('⚠️ UYARI: assets/notification.wav bulunamadı! Varsayılan ses çalacaktır.');
  }
  // --------------------------------------------

  // 3. İKON İŞLEMLERİ (SIPS)
  if (fs.existsSync(xcodeProj)) {
      console.log('🎨 İkonlar işleniyor...');
      try {
          const iosIconDir = path.join(iosDir, 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
          
          if (fs.existsSync(iosIconDir)) {
             try { fs.rmSync(iosIconDir, { recursive: true, force: true }); } catch(e) {}
          }
          fs.mkdirSync(iosIconDir, { recursive: true });

          const buffer = await downloadImage(ICON_URL);
          const masterPath = path.join(iosIconDir, 'master.png');
          fs.writeFileSync(masterPath, buffer);

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

          for (const icon of icons) {
              const destPath = path.join(iosIconDir, icon.name);
              try {
                  execSync(`sips -z ${icon.size} ${icon.size} "${masterPath}" --out "${destPath}"`, { stdio: 'ignore' });
              } catch (sipsErr) {
                  fs.copyFileSync(masterPath, destPath);
              }
          }
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
      } catch (err) {
          console.error("⚠️ İkon işlemi hatası:", err.message);
      }
  }

  // 4. Sync & Patch
  try {
      console.log('🔄 Sync işlemi başlatılıyor...');
      execSync('npx cap sync ios', { stdio: 'inherit', cwd: rootDir });
      patchAdMobFiles(rootDir);
  } catch(e) {
      console.error('❌ Sync hatası:', e);
  }

  // 5. Info.plist Düzenlemeleri
  const infoPlistPath = path.join(iosDir, 'App', 'App', 'Info.plist');
  if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      
      const now = new Date();
      const buildVer = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      
      console.log(`📝 Info.plist Güncelleniyor... (v${APP_VERSION}, Build: ${buildVer})`);

      // Version ve Build Number
      if (content.includes('CFBundleShortVersionString')) {
          content = content.replace(/<key>CFBundleShortVersionString<\/key>[\s\S]*?<string>.*?<\/string>/, `<key>CFBundleShortVersionString</key>
    <string>${APP_VERSION}</string>`);
      } else {
          content = content.replace('<dict>', `<dict>
    <key>CFBundleShortVersionString</key>
    <string>${APP_VERSION}</string>`);
      }

      if (content.includes('CFBundleVersion')) {
          content = content.replace(/<key>CFBundleVersion<\/key>[\s\S]*?<string>.*?<\/string>/, `<key>CFBundleVersion</key>
    <string>${buildVer}</string>`);
      } else {
          content = content.replace('<dict>', `<dict>
    <key>CFBundleVersion</key>
    <string>${buildVer}</string>`);
      }

      // TR Zorlaması
      if (content.includes('CFBundleDevelopmentRegion')) {
          content = content.replace(/<key>CFBundleDevelopmentRegion<\/key>[\s\S]*?<string>.*?<\/string>/, `<key>CFBundleDevelopmentRegion</key>
    <string>tr</string>`);
      } else {
          content = content.replace('<dict>', `<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>tr</string>`);
      }

      if (content.includes('CFBundleLocalizations')) {
          content = content.replace(
              /<key>CFBundleLocalizations<\/key>[\s\S]*?<array>[\s\S]*?<\/array>/, 
              `<key>CFBundleLocalizations</key>
    <array>
        <string>tr</string>
    </array>`
          );
      } else {
          content = content.replace('<dict>', `<dict>
    <key>CFBundleLocalizations</key>
    <array>
        <string>tr</string>
    </array>`);
      }
      
      if (!content.includes('ITSAppUsesNonExemptEncryption')) {
          content = content.replace('<dict>', `<dict>
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>`);
      }

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
      console.log('✅ Info.plist güncellendi.');
  } else {
      console.error(`❌ HATA: Info.plist dosyası bulunamadı! Yol: ${infoPlistPath}`);
      process.exit(1); 
  }

  const podfilePath = path.join(iosDir, 'App', 'Podfile');
  if (fs.existsSync(podfilePath)) {
      let podContent = fs.readFileSync(podfilePath, 'utf8');
      podContent = podContent.replace(/platform :ios, .*/, "platform :ios, '13.0'");
      fs.writeFileSync(podfilePath, podContent);
  }

  console.log('🎉 Script başarıyla tamamlandı.');
}

main().catch(e => {
    console.error("Beklenmeyen Hata:", e);
    process.exit(1);
});
