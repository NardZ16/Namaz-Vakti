
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

  // 5. ADIM: İKON İŞLEMLERİ (logo.png veya icon.png)
  console.log('🎨 İkon işlemleri başlatılıyor...');
  
  try {
      // Sharp'ı yükle
      if (!fs.existsSync('node_modules/sharp')) {
          console.log('📦 Görüntü işleme aracı (sharp) yükleniyor...');
          execSync('npm install sharp --no-save', { stdio: 'inherit' });
      }

      const sharpPath = path.resolve('./node_modules/sharp');
      const sharp = require(sharpPath);

      // Aday dosyalar (Öncelik sırası)
      const candidates = ['assets/logo.png', 'assets/icon.png'];
      let fileFound = false;

      for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
              fileFound = true;
              console.log(`🔍 "${candidate}" dosyası bulundu. İşleniyor...`);
              
              try {
                  const tempBuffer = fs.readFileSync(candidate);
                  const fixedIconPath = 'assets/icon_fixed.png';

                  // Resmi onar ve 1024x1024 PNG olarak kaydet
                  await sharp(tempBuffer)
                      .resize(1024, 1024, { fit: 'cover' })
                      .png()
                      .toFile(fixedIconPath);

                  // Başarılıysa orijinalin üzerine yaz
                  fs.renameSync(fixedIconPath, candidate);
                  console.log(`✅ "${candidate}" doğrulandı ve optimize edildi.`);
                  
                  // Çakışmayı önlemek için diğer adayı temizle (eğer varsa)
                  candidates.forEach(c => {
                      if (c !== candidate && fs.existsSync(c)) {
                          fs.unlinkSync(c);
                      }
                  });

                  break; 
              } catch (err) {
                  console.error(`\n❌ KRİTİK HATA: "${candidate}" dosyası resim formatı olarak okunamadı!`);
                  console.error(`👉 Teknik Hata: ${err.message}`);
                  console.error(`💡 ÇÖZÜM: Dosyanızın uzantısı .png olsa bile içi JPEG veya WebP olabilir.`);
                  console.error(`   Lütfen dosyayı Paint veya bir editörde açıp "Farklı Kaydet" diyerek PNG formatında tekrar kaydedin.\n`);
                  // DOSYAYI SİLMİYORUZ. Kullanıcı hatayı görsün ve düzeltsin.
                  break;
              }
          }
      }

      // Eğer HİÇ dosya yoksa varsayılan oluştur (Var olan bozuksa dokunma)
      if (!fileFound) {
          console.log('⚠️ İkon dosyası bulunamadı, varsayılan oluşturuluyor...');
          const svgBuffer = Buffer.from(`
            <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <rect width="1024" height="1024" fill="#0f766e"/>
              <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="200" fill="white" font-weight="bold">NAMAZ</text>
            </svg>
          `);
          
          await sharp(svgBuffer)
            .png()
            .toFile('assets/logo.png');
            
          console.log('✅ Varsayılan "assets/logo.png" oluşturuldu.');
      }

      // Capacitor Assets'i çalıştır
      console.log('🚀 Native ikonlar üretiliyor (capacitor-assets)...');
      execSync('npx capacitor-assets generate --ios', { stdio: 'inherit' });
      console.log('✅ İkon süreci tamamlandı.');

  } catch (e) {
      console.error('⚠️ İkon oluşturma genel hatası:', e.message);
  }
}

main();
