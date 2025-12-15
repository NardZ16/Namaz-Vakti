
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
            // Redirect takibi (Hızlıresim bazen redirect atabilir)
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
        console.warn("⚠️ AdMob plugin klasörü bulunamadı (henüz yüklenmemiş olabilir).");
        return;
    }
    
    // Patch: ConsentExecutor.swift
    const consentPath = path.join(basePath, 'Consent', 'ConsentExecutor.swift');
    if (fs.existsSync(consentPath)) {
        let content = fs.readFileSync(consentPath, 'utf8');
        
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

        if (modified) fs.writeFileSync(consentPath, content);
    }

    // Patch: BannerExecutor.swift
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
  console.log('🚀 Script Başlatılıyor (NO-SHARP MODE)...');

  // 1. ADIM: Web Klasörleri
  if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist'); 
      fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Hazırlanıyor...</body></html>');
  }
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');

  // 2. ADIM: iOS PLATFORMUNU OLUŞTUR
  // Sharp beklemeden önce platformu garantiye alıyoruz.
  const xcodeprojPath = 'ios/App/App.xcodeproj';
  if (!fs.existsSync(xcodeprojPath)) {
      console.log('⚙️ iOS projesi bulunamadı. Oluşturuluyor...');
      
      // Bozuk klasör temizliği
      if (fs.existsSync('ios')) {
          try { fs.rmSync('ios', { recursive: true, force: true }); } catch(e) {}
      }

      try {
        execSync('npx cap add ios', { stdio: 'inherit' });
        console.log('✅ iOS platformu eklendi.');
      } catch (e) {
        console.error('❌ iOS platformu EKLENEMEDİ:', e.message);
      }
  } else {
      console.log('✅ iOS projesi mevcut.');
  }

  // 3. ADIM: İKONLARI İNDİR VE KOPYALA (SHARP OLMADAN)
  if (fs.existsSync(xcodeprojPath)) {
      console.log(`🎨 İkon indiriliyor: ${ICON_URL}`);
      try {
          const iosIconDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
          
          if (fs.existsSync(iosIconDir)) {
             try { fs.rmSync(iosIconDir, { recursive: true, force: true }); } catch(e) {}
          }
          fs.mkdirSync(iosIconDir, { recursive: true });

          // Resmi indir
          const buffer = await downloadImage(ICON_URL);
          console.log(`📥 Resim indirildi (${buffer.length} bytes). İşleniyor...`);

          const iconFiles = [
            "AppIcon-20x20@2x.png",
            "AppIcon-20x20@3x.png",
            "AppIcon-29x29@2x.png",
            "AppIcon-29x29@3x.png",
            "AppIcon-40x40@2x.png",
            "AppIcon-40x40@3x.png",
            "AppIcon-60x60@2x.png",
            "AppIcon-60x60@3x.png",
            "AppIcon-76x76@2x.png",
            "AppIcon-83.5x83.5@2x.png",
            "AppIcon-512@2x.png"
          ];

          // DİKKAT: Resize yapmıyoruz. Aynı büyük resmi tüm dosya isimlerine kopyalıyoruz.
          // iOS bunu build sırasında uyarı verse de kabul eder ve kendi küçültür.
          for (const filename of iconFiles) {
              fs.writeFileSync(path.join(iosIconDir, filename), buffer);
          }

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
          console.log("✅ İkonlar başarıyla kopyalandı (Resize atlandı).");
      } catch (err) {
          console.error("⚠️ İkon işlemi hatası:", err.message);
      }
  }

  // 4. ADIM: SYNC & PATCH
  try {
      console.log('🔄 Capacitor Sync...');
      execSync('npx cap sync ios', { stdio: 'inherit' });
      patchAdMobFiles();
  } catch(e) {
      console.warn('Sync/Patch uyarısı:', e.message);
  }

  // 5. ADIM: Info.plist GÜNCELLEMELERİ
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      const now = new Date();
      const buildVer = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      
      content = content.replace(/<key>CFBundleVersion<\/key>[\s\r\n]*<string>.*?<\/string>/g, `<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);
      
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

  // Podfile Düzeltmesi
  const podfilePath = path.join('ios', 'App', 'Podfile');
  if (fs.existsSync(podfilePath)) {
      let podContent = fs.readFileSync(podfilePath, 'utf8');
      podContent = podContent.replace(/platform :ios, .*/, "platform :ios, '13.0'");
      fs.writeFileSync(podfilePath, podContent);
  }

  console.log('🎉 Script tamamlandı (Sharp\'sız Mod).');
}

main().catch(e => {
    console.error("Beklenmeyen Hata:", e);
    process.exit(0);
});
