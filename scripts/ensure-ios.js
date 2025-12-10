
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🛠️ iOS Ortamı Hazırlanıyor (Local Fix) ---');

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

      // Şifreleme Uyumluluğu
      if (!plistContent.includes('ITSAppUsesNonExemptEncryption')) {
          const encryptionKey = `
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>
          `;
          plistContent = plistContent.replace('<dict>', '<dict>' + encryptionKey);
      }

      // 🔄 OTO BUILD NUMARASI GÜNCELLEME
      const now = new Date();
      const buildNumber = now.getFullYear().toString() +
                          (now.getMonth() + 1).toString().padStart(2, '0') +
                          now.getDate().toString().padStart(2, '0') +
                          now.getHours().toString().padStart(2, '0') +
                          now.getMinutes().toString().padStart(2, '0');

      console.log(`🔢 Build Numarası Güncelleniyor: ${buildNumber}`);

      const buildVerRegex = /(<key>CFBundleVersion<\/key>[\s\r\n]*<string>)([^<]+)(<\/string>)/;
      if (buildVerRegex.test(plistContent)) {
          plistContent = plistContent.replace(buildVerRegex, `$1${buildNumber}$3`);
      } else {
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

      if (podfileContent.includes("platform :ios")) {
          podfileContent = podfileContent.replace(/platform :ios, .*/, "platform :ios, '13.0'");
      } else {
          podfileContent = "platform :ios, '13.0'\n" + podfileContent;
      }

      fs.writeFileSync(podfilePath, podfileContent);
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

  // 5. ADIM: İKON İŞLEMLERİ (Sadece Yerel Dosya)
  // Capacitor Assets öncelikle logo.png dosyasını arar, yoksa icon.png dosyasına bakar.
  let iconPath = null;
  if (fs.existsSync('assets/logo.png')) {
      iconPath = 'assets/logo.png';
  } else if (fs.existsSync('assets/icon.png')) {
      iconPath = 'assets/icon.png';
  }
  
  if (iconPath) {
      console.log(`🎨 İkon dosyası bulundu (${iconPath}). İşleniyor...`);
      
      try {
          // Sharp'ı yükle
          console.log('📦 Görüntü işleme aracı (sharp) yükleniyor...');
          execSync('npm install sharp --no-save', { stdio: 'inherit' });

          // Sharp modülünü dinamik olarak çağır
          const sharpPath = path.resolve('./node_modules/sharp');
          const sharp = require(sharpPath);

          // RESİM ONARMA: Dosyayı oku ve zorla PNG olarak yeniden kaydet.
          // Bu adım, uzantısı .png olup içeriği bozuk/farklı olan dosyaları düzeltir.
          console.log('🛠️ İkon dosyası doğrulanıyor ve onarılıyor...');
          const tempBuffer = fs.readFileSync(iconPath);
          
          // Geçici dosya adı
          const fixedIconPath = 'assets/icon_fixed.png';

          await sharp(tempBuffer)
            .resize(1024, 1024, { fit: 'cover' }) // Boyutu garanti et
            .png() // Zorla PNG yap
            .toFile(fixedIconPath); // Geçici dosyaya yaz

          // Orijinal dosyanın yerine fixed dosyayı koy
          fs.renameSync(fixedIconPath, iconPath);
          console.log(`✅ ${iconPath} onarıldı ve 1024x1024 PNG formatına çevrildi.`);

          // Eski iOS ikonlarını sil (Temiz başlangıç)
          const appIconSetPath = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';
          if (fs.existsSync(appIconSetPath)) {
              console.log('🧹 Eski AppIcon seti temizleniyor...');
              fs.rmSync(appIconSetPath, { recursive: true, force: true });
          }

          // Capacitor Assets'i çalıştır
          console.log('🚀 İkonlar üretiliyor...');
          execSync('npx capacitor-assets generate --ios', { stdio: 'inherit' });
          console.log('✅ İkon süreci tamamlandı.');

      } catch (e) {
          console.error('⚠️ İkon oluşturma hatası:', e.message);
          console.error(`Lütfen "${iconPath}" dosyanızın geçerli bir resim olduğundan emin olun.`);
      }
  } else {
      console.log('⚠️ UYARI: "assets/logo.png" veya "assets/icon.png" dosyası bulunamadı!');
      console.log('ℹ️ Varsayılan Capacitor ikonu kullanılacak. Kendi ikonunuzu eklemek için assets klasörüne logo.png (1024x1024) yükleyin.');
  }
}

main();
