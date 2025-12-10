
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🛠️ iOS Ortamı Hazırlanıyor (v5 - Full Icon Set) ---');

  // 0. ADIM: Gerekli Klasörleri Oluştur
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
    fs.writeFileSync('dist/index.html', '<!DOCTYPE html><html><body>Placeholder</body></html>');
  }
  if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
  }

  // 1. ADIM: İKON KAYNAĞINI BELİRLE
  const possibleSources = ['icon.png', 'logo.png', 'assets/icon.png', 'assets/logo.png'];
  let sourceFound = false;
  
  // Sharp kurulumu
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('📦 Grafik motoru (sharp) yükleniyor...');
    try {
        execSync('npm install sharp --no-save', { stdio: 'inherit' });
        sharp = require('sharp');
    } catch (err) {
        console.warn('⚠️ Sharp yüklenemedi.');
    }
  }

  // Kaynak resmi bul ve assets/logo.png'ye standartla
  for (const src of possibleSources) {
      if (fs.existsSync(src)) {
          console.log(`📦 Kaynak resim bulundu: ${src}`);
          if (sharp) {
              try {
                  const buffer = fs.readFileSync(src);
                  // 1024x1024 boyutunda temiz bir PNG oluştur
                  await sharp(buffer).resize(1024, 1024).png().toFile('assets/logo.png');
                  sourceFound = true;
                  console.log('✅ Resim optimize edildi: assets/logo.png');
              } catch(e) {
                  console.error('❌ Resim işleme hatası:', e.message);
              }
          } else {
              fs.copyFileSync(src, 'assets/logo.png');
              sourceFound = true;
          }
          break;
      }
  }

  // Resim yoksa varsayılan oluştur
  if (!sourceFound && sharp) {
      console.log('✨ Varsayılan ikon oluşturuluyor...');
      const iconSvg = `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f766e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#115e59;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#bg)"/>
        <rect x="80" y="80" width="864" height="864" rx="180" fill="none" stroke="#d4af37" stroke-width="20" opacity="0.3"/>
        <text x="512" y="550" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="400" fill="#d4af37">N</text>
      </svg>
      `;
      await sharp(Buffer.from(iconSvg)).png().toFile('assets/logo.png');
  }

  // 2. ADIM: iOS PLATFORMU EKLE
  const xcodeProjPath = 'ios/App/App.xcodeproj';
  if (!fs.existsSync(xcodeProjPath)) {
    if (fs.existsSync('ios')) {
        console.log('🧹 Eski iOS klasörü temizleniyor...');
        fs.rmSync('ios', { recursive: true, force: true });
    }
    console.log('✨ iOS platformu ekleniyor...');
    execSync('npx cap add ios', { stdio: 'inherit' });
  }

  // 3. ADIM: İKON SETİNİ OLUŞTUR (TAM SET)
  console.log('🚀 İkon seti üretiliyor...');
  const iosAssetDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

  // Hedef klasörü sıfırla
  if (fs.existsSync(iosAssetDir)) {
      try {
        fs.rmSync(iosAssetDir, { recursive: true, force: true });
        await new Promise(r => setTimeout(r, 500));
      } catch (e) { console.warn("Klasör temizleme uyarısı:", e.message); }
  }
  if (!fs.existsSync(iosAssetDir)) {
      fs.mkdirSync(iosAssetDir, { recursive: true });
  }

  if (sharp) {
    try {
        const sourceBuffer = fs.readFileSync('assets/logo.png');
        
        // iOS için gerekli tüm boyutlar
        const icons = [
            { size: 40, name: 'AppIcon-20x20@2x.png' },
            { size: 60, name: 'AppIcon-20x20@3x.png' },
            { size: 58, name: 'AppIcon-29x29@2x.png' },
            { size: 87, name: 'AppIcon-29x29@3x.png' },
            { size: 80, name: 'AppIcon-40x40@2x.png' },
            { size: 120, name: 'AppIcon-40x40@3x.png' },
            { size: 120, name: 'AppIcon-60x60@2x.png' }, // iPhone Ana Ekran
            { size: 180, name: 'AppIcon-60x60@3x.png' }, // iPhone Ana Ekran
            { size: 76, name: 'AppIcon-76x76@1x.png' },  // iPad
            { size: 152, name: 'AppIcon-76x76@2x.png' }, // iPad
            { size: 167, name: 'AppIcon-83.5x83.5@2x.png' }, // iPad Pro
            { size: 1024, name: 'AppIcon-512@2x.png' }   // App Store
        ];

        // Tüm boyutları üret
        for (const icon of icons) {
            await sharp(sourceBuffer)
                .resize(icon.size, icon.size)
                .png()
                .toFile(path.join(iosAssetDir, icon.name));
        }

        // Contents.json (Xcode'un dosyaları tanıması için harita)
        const contents = {
            "images": [
                { "size": "20x20", "idiom": "iphone", "filename": "AppIcon-20x20@2x.png", "scale": "2x" },
                { "size": "20x20", "idiom": "iphone", "filename": "AppIcon-20x20@3x.png", "scale": "3x" },
                { "size": "29x29", "idiom": "iphone", "filename": "AppIcon-29x29@2x.png", "scale": "2x" },
                { "size": "29x29", "idiom": "iphone", "filename": "AppIcon-29x29@3x.png", "scale": "3x" },
                { "size": "40x40", "idiom": "iphone", "filename": "AppIcon-40x40@2x.png", "scale": "2x" },
                { "size": "40x40", "idiom": "iphone", "filename": "AppIcon-40x40@3x.png", "scale": "3x" },
                { "size": "60x60", "idiom": "iphone", "filename": "AppIcon-60x60@2x.png", "scale": "2x" },
                { "size": "60x60", "idiom": "iphone", "filename": "AppIcon-