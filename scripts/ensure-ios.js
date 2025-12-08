
const fs = require('fs');
const { execSync } = require('child_process');

const ADMOB_APP_ID = "ca-app-pub-4319080566007267~6922736225";

async function main() {
  console.log('--- 🛠️ iOS Ortamı ve AdMob Yapılandırması Başlatılıyor (Fixed SDK Pinning) ---');

  // 0. ADIM: dist klasörü kontrolü (Capacitor Sync hatasını önlemek için)
  if (!fs.existsSync('dist')) {
    console.log('⚠️ dist klasörü bulunamadı. Geçici olarak oluşturuluyor...');
    fs.mkdirSync('dist');
    fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Placeholder</body></html>');
  }

  const iosFolderPath = 'ios';
  const xcodeProjPath = 'ios/App/App.xcodeproj';

  // 1. ADIM: iOS Projesi Var mı Kontrol Et
  if (!fs.existsSync(xcodeProjPath)) {
    console.log('⚠️ Geçerli bir iOS projesi bulunamadı.');
    
    if (fs.existsSync(iosFolderPath)) {
        console.log('🧹 Bozuk iOS klasörü temizleniyor...');
        fs.rmSync(iosFolderPath, { recursive: true, force: true });
    }

    try {
      console.log('📦 iOS platformu oluşturuluyor (npx cap add ios)...');
      execSync('npx cap add ios', { stdio: 'inherit' });
      console.log('✅ iOS platformu eklendi.');
    } catch (e) {
      console.error('❌ iOS platformu eklenirken hata oluştu:', e);
      process.exit(1);
    }
  } else {
    console.log('✅ iOS projesi mevcut.');
  }

  // 2. ADIM: Podfile Düzenlemesi ve SDK Sabitleme
  const podfilePath = 'ios/App/Podfile';
  if (fs.existsSync(podfilePath)) {
      console.log('🔧 Podfile düzenleniyor ve SDK sürümleri sabitleniyor...');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // 2.1. Platform Sürümünü iOS 13.0+ Yap (AdMob 10.x için yeterli ve güvenli)
      // 15.0 yaparsak bazı eski eklentiler sorun çıkarabilir, 13.0 ideal.
      if (podfileContent.includes("platform :ios")) {
          podfileContent = podfileContent.replace(/platform :ios, .*/, "platform :ios, '13.0'");
      } else {
          podfileContent = "platform :ios, '13.0'\n" + podfileContent;
      }

      // 2.2. SDK Sabitleme (Derleme Hatalarını Önlemek İçin)
      // Bu satırlar Podfile'ın en üstüne eklenerek versiyonları kilitler.
      const fixedPods = `
# Fix for UMPConsentStatus renamed to ConsentStatus
# We must use older SDKs that match the Plugin's code
def cap_pods_fix
  pod 'Google-Mobile-Ads-SDK', '10.14.0'
  pod 'GoogleUserMessagingPlatform', '2.0.0'
end
`;
      
      // 'def capacitor_pods' satırından önce ekliyoruz ki yüklenirken bu versiyonları baz alsın
      // veya dosyanın sonuna target içine ekleyebiliriz. En garantisi target 'App' içine eklemek.
      
      // Mevcut içeriği temizle (tekrar tekrar eklememek için)
      podfileContent = podfileContent.replace(/pod 'Google-Mobile-Ads-SDK'.*\n/g, '');
      podfileContent = podfileContent.replace(/pod 'GoogleUserMessagingPlatform'.*\n/g, '');

      // Target bloğunun içine enjekte et
      if (podfileContent.includes("target 'App' do")) {
         podfileContent = podfileContent.replace("target 'App' do", "target 'App' do\n  pod 'Google-Mobile-Ads-SDK', '10.14.0'\n  pod 'GoogleUserMessagingPlatform', '2.0.0'");
      }

      // Her zaman temiz bir pod kurulumu için lock ve pods silinir
      console.log('🧹 Temiz kurulum için Podfile.lock ve Pods klasörü temizleniyor...');
      const lockFile = 'ios/App/Podfile.lock';
      const podsDir = 'ios/App/Pods';
      if (fs.existsSync(lockFile)) fs.rmSync(lockFile);
      if (fs.existsSync(podsDir)) fs.rmSync(podsDir, { recursive: true, force: true });
      
      fs.writeFileSync(podfilePath, podfileContent);
  }

  // 3. ADIM: Info.plist İçine AdMob ID Ekle
  const plistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(plistPath)) {
    let content = fs.readFileSync(plistPath, 'utf8');

    if (!content.includes('GADApplicationIdentifier')) {
      console.log('📝 Info.plist dosyasına AdMob ID ekleniyor...');
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
      
      content = content.replace('</dict>\n</plist>', adMobEntry + '\n</dict>\n</plist>');
      fs.writeFileSync(plistPath, content);
    }
  }

  // 4. ADIM: Sync ve Pod Install
  try {
      console.log('🔄 Capacitor Sync ve Pod Install başlatılıyor...');
      execSync('npx cap sync ios', { stdio: 'inherit' });
      console.log('✅ Kurulum başarıyla tamamlandı.');
  } catch (e) {
      console.error('❌ Sync hatası:', e);
      process.exit(1); 
  }
}

main();
