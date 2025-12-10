const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🍎 iOS Build Hazırlığı (Standart Mod) ---');

  // 1. iOS Platform Kontrolü
  if (!fs.existsSync('ios/App/App.xcodeproj')) {
    console.log('✨ iOS platformu ekleniyor...');
    // iOS klasörü bozuksa temizle
    if (fs.existsSync('ios')) fs.rmSync('ios', { recursive: true, force: true });
    try {
        execSync('npx cap add ios', { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ iOS platformu eklenemedi:', e.message);
    }
  }

  // 2. Kaynak Resim Hazırlığı (Sadece Kaynağı Düzeltir)
  // Capacitor Assets aracı 'assets/logo.png' veya 'assets/icon.png' arar.
  // Kullanıcının yüklediği dosya bozuk formatta olabilir (adı png ama içi jpg).
  // Bunu düzeltip bırakacağız, üretimi araca bırakacağız.
  
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');

  const potentialFiles = [
    'icon.png', 'icon.jpg', 'icon.jpeg',
    'logo.png', 'logo.jpg', 'logo.jpeg',
    'assets/icon.png', 'assets/icon.jpg',
    'assets/logo.png', 'assets/logo.jpg'
  ];

  let sourceFile = null;
  for (const f of potentialFiles) {
    if (fs.existsSync(f)) {
      sourceFile = f;
      break;
    }
  }

  if (sourceFile) {
      console.log(`📦 Kaynak resim bulundu: ${sourceFile}`);
      try {
          const sharp = require('sharp');
          const inputBuffer = fs.readFileSync(sourceFile);
          
          // Resmi standart PNG'ye çevirip assets/logo.png olarak kaydet
          // Bu işlem "Unsupported Image Format" hatasını önler.
          await sharp(inputBuffer)
            .resize(1024, 1024, { fit: 'cover' }) // Kare format garantisi
            .png()
            .toFile('assets/logo.png');
            
          console.log('✅ Kaynak resim onarıldı ve assets/logo.png konumuna hazırlandı.');
      } catch (e) {
          console.warn('⚠️ Resim işlenemedi (Sharp yüklü değil veya hata), dosya olduğu gibi kullanılıyor.');
          // Sharp yoksa ve dosya assets/logo.png değilse oraya kopyala
          if (sourceFile !== 'assets/logo.png') {
              fs.copyFileSync(sourceFile, 'assets/logo.png');
          }
      }
  } else {
      console.warn('⚠️ Herhangi bir ikon dosyası bulunamadı. Varsayılan Capacitor ikonu kullanılacak.');
  }

  // 3. Standart İkon Oluşturma Aracı (Kullanıcının isteği üzerine)
  console.log('🚀 Standart araç ile ikonlar üretiliyor...');
  
  // Windows kilitlenme hatasını önlemek için hedef klasörü temizle
  const iosAssetDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  if (fs.existsSync(iosAssetDir)) {
      try { fs.rmSync(iosAssetDir, { recursive: true, force: true }); } catch(e) {}
  }

  try {
      execSync('npx capacitor-assets generate --ios', { stdio: 'inherit' });
      console.log('✅ İkonlar başarıyla oluşturuldu.');
  } catch (e) {
      console.error('❌ İkon oluşturma aracı hatası:', e.message);
      console.log('ℹ️ İkonlar oluşturulamadıysa bile build devam edecek.');
  }

  // 4. Info.plist Güncellemeleri (App Store Connect'te görünmesi için ŞART)
  const infoPlistPath = 'ios/App/App/Info.plist';
  if (fs.existsSync(infoPlistPath)) {
      let content = fs.readFileSync(infoPlistPath, 'utf8');
      
      // A. Benzersiz Versiyon Numarası (Duplicate build hatasını önler)
      const now = new Date();
      // Format: YYYYMMDDHHmm
      const buildVer = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      
      // Mevcut CFBundleVersion'ı temizle ve yenisini ekle
      content = content.replace(/<key>CFBundleVersion<\/key>[\s\r\n]*<string>.*?<\/string>/g, '');
      content = content.replace('<dict>', `<dict>\n<key>CFBundleVersion</key>\n<string>${buildVer}</string>`);

      // B. Şifreleme İzni (Export Compliance - Build'in görünmemesini çözer)
      // Eğer bu ayar yoksa Apple "Missing Compliance" der ve testflight'a düşmez.
      if (!content.includes('ITSAppUsesNonExemptEncryption')) {
          content = content.replace('<dict>', `<dict>\n<key>ITSAppUsesNonExemptEncryption</key>\n<false/>`);
      }

      // C. Konum İzin Açıklamaları (Reddedilmeyi önler)
      if (!content.includes('NSLocationWhenInUseUsageDescription')) {
          content = content.replace('<dict>', `<dict>
            <key>NSLocationWhenInUseUsageDescription</key>
            <string>Namaz vakitlerini hesaplamak için konum gereklidir.</string>
            <key>NSLocationAlwaysUsageDescription</key>
            <string>Namaz vakitlerini hesaplamak için konum gereklidir.</string>`);
      }

      fs.writeFileSync(infoPlistPath, content);
      console.log(`✅ Info.plist güncellendi. Build No: ${buildVer}`);
  }

  // 5. Değişiklikleri Eşitle
  try {
    execSync('npx cap sync ios', { stdio: 'inherit' });
  } catch (e) {
    console.warn('Sync uyarısı:', e.message);
  }
}

main();