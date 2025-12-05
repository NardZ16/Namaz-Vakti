const fs = require('fs');
const { execSync } = require('child_process');

const ADMOB_APP_ID = "ca-app-pub-4319080566007267~6922736225";

async function main() {
  console.log('--- 🛠️ iOS Ortamı ve AdMob Yapılandırması Başlatılıyor ---');

  const iosFolderPath = 'ios';
  const xcodeProjPath = 'ios/App/App.xcodeproj';

  // 1. ADIM: iOS Projesi Var mı Kontrol Et, Yoksa veya Bozuksa Sıfırdan Yarat
  if (!fs.existsSync(xcodeProjPath)) {
    console.log('⚠️ Geçerli bir iOS projesi bulunamadı veya eksik.');
    
    // Varsa bozuk klasörü sil
    if (fs.existsSync(iosFolderPath)) {
        console.log('🧹 Bozuk iOS klasörü temizleniyor...');
        fs.rmSync(iosFolderPath, { recursive: true, force: true });
    }

    try {
      console.log('📦 iOS platformu sıfırdan oluşturuluyor (npx cap add ios)...');
      execSync('npx cap add ios', { stdio: 'inherit' });
      console.log('✅ iOS platformu başarıyla eklendi.');
    } catch (e) {
      console.error('❌ iOS platformu eklenirken hata oluştu:', e);
      process.exit(1);
    }
  } else {
    console.log('✅ iOS projesi mevcut.');
  }

  // 2. ADIM: Podfile İçine Google SDK Sürümünü Sabitle (CRITICAL FIX)
  // Bu adım "UMPConsentStatus" hatasını çözer. Google SDK v11 yerine v10 kullanılmasını zorlar.
  // AYRICA: @capacitor-community/admob plugin'i genellikle belirli bir sürüme (= 10.12.0) bağımlıdır.
  // Bu yüzden sürüm çakışmasını önlemek için tam olarak o sürümü kullanmalıyız.
  const podfilePath = 'ios/App/Podfile';
  if (fs.existsSync(podfilePath)) {
      console.log('🔧 Podfile düzenleniyor...');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // 2.1. Platform Sürümünü Yükselt (iOS 13.0)
      // Google Mobile Ads SDK güncel sürümleri ve bazı pluginler iOS 12/13+ gerektirebilir.
      if (podfileContent.includes("platform :ios")) {
          podfileContent = podfileContent.replace(/platform :ios, .*/, "platform :ios, '13.0'");
      } else {
          podfileContent = "platform :ios, '13.0'\n" + podfileContent;
      }

      // 2.2. Google SDK Sürümünü Ekle/Düzenle
      const sdkLine = "pod 'Google-Mobile-Ads-SDK', '10.12.0'";
      
      if (podfileContent.includes("Google-Mobile-Ads-SDK")) {
          // Mevcut varsa güncelle
          podfileContent = podfileContent.replace(
              /pod 'Google-Mobile-Ads-SDK'.*/, 
              sdkLine
          );
      } else {
          // Yoksa 'target 'App' do' altına ekle
          podfileContent = podfileContent.replace(
              /target 'App' do/g, 
              "target 'App' do\n  # FIX: Match version required by @capacitor-community/admob plugin\n  " + sdkLine
          );
      }
      
      fs.writeFileSync(podfilePath, podfileContent);
      console.log('✅ Podfile güncellendi: Platform iOS 13.0 ve Google SDK 10.12.0 ayarlandı.');
  }

  // 3. ADIM: Info.plist İçine AdMob ID Ekle (Uygulama Çökmesini Önler)
  const plistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(plistPath)) {
    console.log('📝 Info.plist dosyasına AdMob ID ekleniyor...');
    let content = fs.readFileSync(plistPath, 'utf8');

    if (!content.includes('GADApplicationIdentifier')) {
      const adMobEntry = `
    <key>GADApplicationIdentifier</key>
    <string>${ADMOB_APP_ID}</string>
    <key>SKAdNetworkItems</key>
    <array>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>cstr6suwn9.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>4fzdc2evr5.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>2fnua5tdw4.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>ydx93a7ass.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>5a6flpkh64.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>p78axxw29g.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>v72qych5uu.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>c6k4g5qg8m.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>s39g8kddmq.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>3qy4746246.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>3sh42y64q3.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>f38h382jlk.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>hs6bdukanm.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>prcb7njmu6.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>v4nxqhlyqp.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>wzmmz9fp6w.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>yclnxrl5pm.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>t38b2kh725.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>7ug5zh24hu.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>9rd848q2bz.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>n6fk4nfna4.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>kbd757ywx3.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>9t245vhmpl.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>4468km3ulz.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>2u9pt9hc89.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>8s468mfl3y.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>av6w8kgt66.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>klf5c3l5u5.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>ppxm28t8ap.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>424m5254lk.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>uw77j35x4d.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>578prtvx9j.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>4dzt52r2t5.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>e5fvkxwrpn.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>8c4e2ghe7u.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>zq492l623r.skadnetwork</string>
        </dict>
        <dict>
            <key>SKAdNetworkIdentifier</key>
            <string>3qcr597p9d.skadnetwork</string>
        </dict>
    </array>`;
      
      // Plist kapanış etiketinden hemen önce ekle
      content = content.replace('</dict>\n</plist>', adMobEntry + '\n</dict>\n</plist>');
      fs.writeFileSync(plistPath, content);
      console.log('✅ AdMob App ID Info.plist dosyasına eklendi.');
    } else {
      console.log('ℹ️ AdMob ID zaten ekli.');
    }
  } else {
    console.warn('⚠️ Info.plist bulunamadı!');
  }

  // 4. ADIM: Değişiklikleri Uygula (Sync)
  try {
      console.log('🔄 Capacitor senkronizasyonu yapılıyor (npx cap sync ios)...');
      execSync('npx cap sync ios', { stdio: 'inherit' });
      console.log('✅ Senkronizasyon tamamlandı.');
  } catch (e) {
      console.error('❌ Sync hatası:', e);
      // Hata durumunda işlemi başarısız saymamak için exit 1 yapmıyoruz,
      // çünkü build sürecinde bazen loglar yanıltıcı olabilir. 
      // Ancak logları incelemek için konsola basıyoruz.
      process.exit(1); 
  }
}

main();