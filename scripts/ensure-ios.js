const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  console.log('--- 🍎 iOS Build & Icon Fixer Started ---');

  // 1. SETUP & CLEANUP
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
    fs.writeFileSync('dist/index.html', '<html><body>Placeholder</body></html>');
  }
  
  // Detect Icon Source
  const candidates = ['icon.png', 'logo.png', 'assets/icon.png', 'assets/logo.png'];
  let sourceIcon = candidates.find(f => fs.existsSync(f));
  
  if (!sourceIcon) {
    console.log('⚠️ No icon found. Creating default logo.png...');
    const svg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#0f766e"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="500" fill="white">N</text></svg>`;
    fs.writeFileSync('assets/logo.png', svg);
    sourceIcon = 'assets/logo.png';
  }

  // Install Sharp if needed
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('📦 Installing image processor (sharp)...');
    try {
      execSync('npm install sharp --no-save', { stdio: 'ignore' });
      sharp = require('sharp');
    } catch (err) {
      console.warn('⚠️ Sharp install failed. Icons will be copied without resizing.');
    }
  }

  // 2. IOS PLATFORM CHECK (Fix Zombie Folder)
  const xcodeProj = path.join('ios', 'App', 'App.xcodeproj');
  if (fs.existsSync('ios') && !fs.existsSync(xcodeProj)) {
      console.log('🧹 Cleaning corrupted iOS folder...');
      fs.rmSync('ios', { recursive: true, force: true });
  }

  if (!fs.existsSync('ios')) {
      console.log('✨ Adding iOS platform...');
      execSync('npx cap add ios', { stdio: 'inherit' });
  }

  // 3. GENERATE ICONS MANUALLY
  console.log('🎨 Generating iOS Icons...');
  const iosIconDir = path.join('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  if (fs.existsSync(iosIconDir)) {
      try { fs.rmSync(iosIconDir, { recursive: true, force: true }); } catch(e){}
  }
  fs.mkdirSync(iosIconDir, { recursive: true });

  const iconSizes = [
    { name: 'AppIcon-20x20@2x.png', size: 40 },
    { name: 'AppIcon-20x20@3x.png', size: 60 },
    { name: 'AppIcon-29x29@2x.png', size: 58 },
    { name: 'AppIcon-29x29@3x.png', size: 87 },
    { name: 'AppIcon-40x40@2x.png', size: 80 },
    { name: 'AppIcon-40x40@3x.png', size: 120 },
    { name: 'AppIcon-60x60@2x.png', size: 120 },
    { name: 'AppIcon-60x60@3x.png', size: 180 },
    { name: 'AppIcon-512@2x.png',   size: 1024 }
  ];

  if (sharp) {
    const iconBuffer = fs.readFileSync(sourceIcon);
    // Process sequentially to avoid memory spikes
    for (const icon of iconSizes) {
        try {
            await sharp(iconBuffer).resize(icon.size, icon.size).png().toFile(path.join(iosIconDir, icon.name));
        } catch (e) { console.error(`Failed to gen ${icon.name}`, e.message); }
    }
  } else {
    for (const icon of iconSizes) {
        fs.copyFileSync(sourceIcon, path.join(iosIconDir, icon.name));
    }
  }

  // Create Contents.json
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
      { "size": "1024x1024", "idiom": "ios-marketing", "filename": "AppIcon-512@2x.png", "scale": "1x" }
    ],
    "info": { "version": 1, "author": "xcode" }
  };
  fs.writeFileSync(path.join(iosIconDir, 'Contents.json'), JSON.stringify(contentsJson, null, 2));

  // 4. UPDATE INFO.PLIST (Versioning & Permissions)
  const plistPath = path.join('ios', 'App', 'App', 'Info.plist');
  if (fs.existsSync(plistPath)) {
      let plist = fs.readFileSync(plistPath, 'utf8');
      
      // Generate Unique Build Number: YYYYMMDDHHmm
      const d = new Date();
      const ver = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
      
      if (plist.includes('CFBundleVersion')) {
        plist = plist.replace(/<key>CFBundleVersion<\/key>[\s\r\n]*<string>[^<]+<\/string>/, `<key>CFBundleVersion</key>\n<string>${ver}</string>`);
      } else {
        plist = plist.replace('<dict>', `<dict>\n<key>CFBundleVersion</key>\n<string>${ver}</string>`);
      }

      // Encryption Exemption (Vital for TestFlight visibility)
      if (!plist.includes('ITSAppUsesNonExemptEncryption')) {
        plist = plist.replace('<dict>', `<dict>\n<key>ITSAppUsesNonExemptEncryption</key>\n<false/>`);
      }

      // Usage Descriptions
      if (!plist.includes('NSLocationWhenInUseUsageDescription')) {
        plist = plist.replace('<dict>', `<dict>
        <key>NSLocationWhenInUseUsageDescription</key><string>Namaz vakitleri hesaplaması için konum gereklidir.</string>
        <key>NSLocationAlwaysUsageDescription</key><string>Namaz vakitleri hesaplaması için konum gereklidir.</string>`);
      }

      fs.writeFileSync(plistPath, plist);
      console.log(`✅ Version bumped to: ${ver}`);
  }

  // 5. SYNC
  console.log('🔄 Syncing Capacitor...');
  try {
    execSync('npx cap sync ios', { stdio: 'inherit' });
  } catch(e) { console.log('Sync warning (ignorable)'); }
  
  console.log('🎉 DONE! Ready for Appflow.');
}

main().catch(console.error);