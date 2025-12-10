
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

  // 1. ADIM: iOS Projesi Kontrolü
  const iosFolderPath = 'ios';
  const xcodeProjPath = 'ios/App/App.xcodeproj';

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

  // 2. ADIM: Info.plist Düzenleme
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      console.log('📝 Info.plist düzenleniyor...');
      let plistContent = fs.readFileSync(infoPlistPath, 'utf8');

      if (!plistContent.includes('NSLocationWhenInUseUsageDescription')) {
          const locationPermissions = `
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Namaz vakitlerini ve kıble yönünü doğru hesaplamak için konumunuza ihtiyacımız var.</string>
    <key>NSLocationAlwaysUsageDescription</key>
    <string>Namaz vakitlerini ve kıble yönünü doğru hesaplamak için konumunuza ihtiyacımız var.</string>
          `;
          plistContent = plistContent.replace('<dict>', '<dict>' + locationPermissions);
      }

      if (!plistContent.includes('ITSAppUsesNonExemptEncryption')) {
          const encryptionKey = `
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>
          `;
          plistContent = plistContent.replace('<dict>', '<dict>' + encryptionKey);
      }

      const now = new Date();
      const buildNumber = now.getFullYear().toString() +
                          (now.getMonth() + 1).toString().padStart(2, '0') +
                          now.getDate().toString().padStart(2, '0') +
                          now.getHours().toString().padStart(2, '0') +
                          now.getMinutes().toString().padStart(2, '0');

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

  // 3. ADIM: Podfile Düzenleme
  const podfilePath = 'ios/App/Podfile';
  if (fs.existsSync(podfilePath)) {
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
      console.log('🔄 Capacitor Sync...');
      execSync('npx cap sync ios', { stdio: 'inherit' });
  } catch (e) {
      console.error('❌ Sync hatası:', e);
  }

  // 5. ADIM: İKON İŞLEMLERİ
  console.log('🎨 İkon işlemleri başlatılıyor...');
  
  if (!fs.existsSync('assets')) {
      fs.mkdirSync('assets');
  }

  try {
      if (!fs.existsSync('node_modules/sharp')) {
          console.log('📦 Sharp yükleniyor...');
          execSync('npm install sharp --no-save', { stdio: 'inherit' });
      }

      const sharpPath = path.resolve('./node_modules/sharp');
      const sharp = require(sharpPath);

      const candidates = ['assets/logo.png', 'assets/icon.png'];
      let fileFound = false;

      for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
              fileFound = true;
              console.log(`🔍 "${candidate}" kontrol ediliyor...`);
              
              try {
                  // Dosyayı belleğe oku (Dosya kilidini önlemek için)
                  const inputBuffer = fs.readFileSync(candidate);
                  
                  // Bellekte işle ve 1024x1024 PNG buffer'ı oluştur
                  const outputBuffer = await sharp(inputBuffer)
                      .resize(1024, 1024, { fit: 'cover' })
                      .png()
                      .toBuffer();

                  // Dosyayı üzerine yaz
                  fs.writeFileSync(candidate, outputBuffer);
                  console.log(`✅ "${candidate}" başarıyla onarıldı ve optimize edildi.`);

                  // Çakışma olmaması için diğer adayı temizle
                  candidates.forEach(c => {
                      if (c !== candidate && fs.existsSync(c)) {
                          fs.unlinkSync(c);
                      }
                  });
                  break; 
              } catch (err) {
                  console.error(`⚠️ "${candidate}" okunamadı: ${err.message}`);
              }
          }
      }

      if (!fileFound) {
          console.log('⚠️ İkon bulunamadı, varsayılan oluşturuluyor...');
          const svgBuffer = Buffer.from(`
            <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <rect width="1024" height="1024" fill="#0f766e"/>
              <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="200" fill="white" font-weight="bold">NAMAZ</text>
            </svg>
          `);
          await sharp(svgBuffer).png().toFile('assets/logo.png');
      }

      // HEDEF KLASÖR KONTROLÜ (Write error'ı önlemek için Windows Fix)
      const targetDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
      
      // Eğer klasör varsa, içini temizle ve sil (Overwrite sorunu için)
      if (fs.existsSync(targetDir)) {
          console.log('🧹 Eski ikon klasörü temizleniyor (Windows Fix)...');
          try {
              fs.rmSync(targetDir, { recursive: true, force: true });
          } catch (e) {
              console.warn('⚠️ Klasör temizlenirken uyarı:', e.message);
          }
      }

      // Klasörü yeniden oluştur
      if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
      }

      // Dosya sistemi gecikmesi için bekleme
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('🚀 Native ikonlar üretiliyor...');
      execSync('npx capacitor-assets generate --ios', { stdio: 'inherit' });
      console.log('✅ İkon süreci tamamlandı.');

  } catch (e) {
      console.error('⚠️ İkon oluşturma sırasında hata:', e.message);
      console.log('ℹ️ Derleme işlemi ikon hatasına rağmen devam edecek.');
  }
}

main();
