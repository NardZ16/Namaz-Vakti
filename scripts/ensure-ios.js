
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const https = require('https');

const ICON_URL = "https://i.ibb.co/hL4L7qX/icon.png"; 

async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        };
        const request = https.get(url, options, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadImage(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Link hatası: ${res.statusCode}`));
                return;
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(data);
                if (buffer[0] !== 0x89) {
                    reject(new Error("Geçersiz PNG!"));
                    return;
                }
                resolve(buffer);
            });
        });
        request.on('error', (err) => reject(err));
    });
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const iosDir = path.join(rootDir, 'ios');
  
  console.log('🚀 iOS Hazırlanıyor...');

  if (fs.existsSync(iosDir)) {
      const iosIconDir = path.join(iosDir, 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
      if (fs.existsSync(iosIconDir)) {
          try {
              const buffer = await downloadImage(ICON_URL);
              const masterPath = path.join(iosIconDir, 'master.png');
              fs.writeFileSync(masterPath, buffer);
              
              // SIPS ile ikonları boyutlandır
              const sizes = [40, 60, 58, 87, 80, 120, 180, 152, 167, 1024];
              sizes.forEach(s => {
                  execSync(`sips -z ${s} ${s} "${masterPath}" --out "${path.join(iosIconDir, 'icon_'+s+'.png')}"`, {stdio:'ignore'});
              });
              fs.unlinkSync(masterPath);
              console.log('✅ iOS İkonları güncellendi.');
          } catch (e) {
              console.error('❌ iOS İkon hatası:', e.message);
          }
      }
  }
}

main();
