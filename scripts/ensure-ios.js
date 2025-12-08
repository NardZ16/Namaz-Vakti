
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  console.log('--- 🛠️ iOS Ortamı Hazırlanıyor (Reklamsız) ---');

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

  // 2. ADIM: Podfile Düzenleme (Platform Ayarı)
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

  // 3. ADIM: Sync ve Pod Install
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