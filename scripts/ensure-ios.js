
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  console.log('--- 🛠️ iOS Ortamı Hazırlanıyor (Reklamsız & Konum İzinli & Auto-Compliance & Auto-Version) ---');

  // 0. ADIM: dist klasörü kontrolü
  if (!fs.existsSync('dist')) {
    console.log('⚠️ dist klasörü bulunamadı. Geçici olarak oluşturuluyor...');
    fs.mkdirSync('dist');
    fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Placeholder</body></html>');
  }

  const iosFolderPath = 'ios';
  const xcodeProjPath = 'ios/App/App.xcodeproj';

  // 1. ADIM: iOS Projesi Kontrolü
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

  // 2. ADIM: Info.plist Düzenleme (Konum, Şifreleme ve Build Numarası)
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      console.log('📝 Info.plist düzenleniyor...');
      let plistContent = fs.readFileSync(infoPlistPath, 'utf8');

      // Konum İzinleri
      if (!plistContent.includes('NSLocationWhenInUseUsageDescription')) {
          const locationPermissions = `
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Namaz vakitlerini ve kıble yönünü doğru hesaplamak için konumunuza ihtiyacımız var.</string>
    <key>NSLocationAlwaysUsageDescription</key>
    <string>Namaz vakitlerini ve kıble yönünü doğru hesaplamak için konumunuza ihtiyacımız var.</string>
          `;
          plistContent = plistContent.replace('<dict>', '<dict>' + locationPermissions);
      }

      // Şifreleme Uyumluluğu (Missing Compliance uyarısını atlamak için)
      if (!plistContent.includes('ITSAppUsesNonExemptEncryption')) {
          const encryptionKey = `
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>
          `;
          plistContent = plistContent.replace('<dict>', '<dict>' + encryptionKey);
      }

      // 🔄 OTO BUILD NUMARASI GÜNCELLEME (TestFlight için ŞART)
      // Format: YYYYMMDDHHmm (Örn: 202512081430)
      const now = new Date();
      const buildNumber = now.getFullYear().toString() +
                          (now.getMonth() + 1).toString().padStart(2, '0') +
                          now.getDate().toString().padStart(2, '0') +
                          now.getHours().toString().padStart(2, '0') +
                          now.getMinutes().toString().padStart(2, '0');

      console.log(`🔢 Build Numarası Güncelleniyor: ${buildNumber}`);

      // CFBundleVersion değerini bul ve değiştir
      // Regex: <key>CFBundleVersion</key> (boşluk/yeni satır) <string>ESKI_NO</string>
      const buildVerRegex = /(<key>CFBundleVersion<\/key>[\s\r\n]*<string>)([^<]+)(<\/string>)/;
      
      if (buildVerRegex.test(plistContent)) {
          plistContent = plistContent.replace(buildVerRegex, `$1${buildNumber}$3`);
      } else {
          // Eğer regex bulamazsa (nadir), manuel eklemeyi dene veya uyar
          console.warn("⚠️ CFBundleVersion bulunamadı, manuel ekleniyor...");
          plistContent = plistContent.replace('<dict>', `<dict>
    <key>CFBundleVersion</key>
    <string>${buildNumber}</string>`);
      }

      fs.writeFileSync(infoPlistPath, plistContent);
  }

  // 3. ADIM: Podfile Düzenleme (Platform Ayarı)
  const podfilePath = 'ios/App/Podfile';
  if (fs.existsSync(podfilePath)) {
      console.log('🔧 Podfile: Platform iOS 13.0 ayarlanıyor...');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // Platform iOS 13.0
      if (podfileContent.includes("platform :ios")) {
          podfileContent = podfileContent.replace(/platform :ios, .*/, "platform :ios, '13.0'");
      } else {
          podfileContent = "platform :ios, '13.0'\n" + podfileContent;
      }

      fs.writeFileSync(podfilePath, podfileContent);
  }

  // 4. ADIM: İkon ve Splash Oluşturma (Appflow Ortamında Çalışır)
  // Windows hatasını önlemek için işlemi burada yapıyoruz.
  if (fs.existsSync('assets/icon.png')) {
      console.log('🎨 İkonlar oluşturuluyor (Appflow)...');
      try {
          // --ios bayrağı ile sadece iOS için üretim yapar, Windows hatasını bypass eder
          execSync('npx capacitor-assets generate --ios', { stdio: 'inherit' });
          console.log('✅ İkonlar başarıyla güncellendi.');
      } catch (e) {
          console.warn('⚠️ İkon oluşturulurken bir uyarı alındı (Kritik olmayabilir):', e.message);
      }
  } else {
      console.log('ℹ️ assets/icon.png bulunamadı, varsayılan ikon kullanılacak.');
  }

  // 5. ADIM: Sync ve Pod Install
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
