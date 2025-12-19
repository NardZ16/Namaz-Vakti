
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const assetsDir = path.join(rootDir, 'assets');
const androidResDir = path.join(androidDir, 'app', 'src', 'main', 'res');
const variablesGradlePath = path.join(androidDir, 'variables.gradle');
const iosScriptPath = path.join(__dirname, 'ensure-ios.js');

// 👇👇👇 İKON AYARI - SOURCE OF TRUTH (ensure-ios.js) 👇👇👇
function getIconUrl() {
    try {
        if (fs.existsSync(iosScriptPath)) {
            const content = fs.readFileSync(iosScriptPath, 'utf8');
            // ensure-ios.js içindeki ICON_URL değerini regex ile yakalar
            const match = content.match(/const ICON_URL\s*=\s*["'](.*?)["']/);
            if (match && match[1]) {
                console.log(`🔗 İkon linki ensure-ios.js dosyasından alındı: ${match[1]}`);
                return match[1];
            }
        }
    } catch (e) {
        console.warn("⚠️ ensure-ios.js dosyasından link okunamadı, varsayılan kullanılıyor.");
    }
    return "https://i.hizliresim.com/dn7awmc.jpg"; // Yedek link
}

const ICON_URL = getIconUrl();
// 👆👆👆 ----------------- 👆👆👆

// Resmi indirme fonksiyonu
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadImage(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Link hatası: ${res.statusCode}`));
                return;
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        });
        request.on('error', (err) => reject(err));
    });
}

async function processIcons() {
    console.log('🎨 Android İkonları Hazırlanıyor...');
    try {
        const buffer = await downloadImage(ICON_URL);
        const tempMaster = path.join(rootDir, 'master_android.png');
        fs.writeFileSync(tempMaster, buffer);

        const iconConfigs = [
            { folder: 'mipmap-mdpi', size: 48 },
            { folder: 'mipmap-hdpi', size: 72 },
            { folder: 'mipmap-xhdpi', size: 96 },
            { folder: 'mipmap-xxhdpi', size: 144 },
            { folder: 'mipmap-xxxhdpi', size: 192 }
        ];

        for (const config of iconConfigs) {
            const destFolder = path.join(androidResDir, config.folder);
            if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
            
            const destPath = path.join(destFolder, 'ic_launcher.png');
            const destRoundPath = path.join(destFolder, 'ic_launcher_round.png');

            try {
                // SIPS (Mac) kullanarak boyutlandır
                execSync(`sips -z ${config.size} ${config.size} "${tempMaster}" --out "${destPath}"`, { stdio: 'ignore' });
                fs.copyFileSync(destPath, destRoundPath);
            } catch (e) {
                // SIPS yoksa (Windows/Linux), direkt kopyala
                fs.copyFileSync(tempMaster, destPath);
                fs.copyFileSync(tempMaster, destRoundPath);
            }
        }

        if (fs.existsSync(tempMaster)) fs.unlinkSync(tempMaster);
        console.log('   ✅ Tüm mipmap ikonları güncellendi.');
    } catch (err) {
        console.error('   ❌ İkon indirme/işleme hatası:', err.message);
    }
}

async function main() {
    console.log('🤖 Android Onarım ve Hazırlık Scripti Başlatılıyor...');

    if (!fs.existsSync(androidDir)) {
        console.error('❌ Android klasörü bulunamadı!');
        process.exit(1);
    }

    // 1. İkonları İşle
    await processIcons();

    // 2. Ses Dosyasını Kopyala
    const soundSource = path.join(assetsDir, 'notification.wav');
    const androidRawDir = path.join(androidResDir, 'raw');
    if (fs.existsSync(soundSource)) {
        if (!fs.existsSync(androidRawDir)) fs.mkdirSync(androidRawDir, { recursive: true });
        fs.copyFileSync(soundSource, path.join(androidRawDir, 'notification.wav'));
        console.log('✅ "notification.wav" kopyalandı.');
    }

    // 3. SDK Sürümlerini Güncelle
    if (fs.existsSync(variablesGradlePath)) {
        let varsContent = fs.readFileSync(variablesGradlePath, 'utf8');
        varsContent = varsContent.replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 35');
        varsContent = varsContent.replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 35');
        varsContent = varsContent.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 24');
        fs.writeFileSync(variablesGradlePath, varsContent);
        console.log('✅ SDK sürümleri 35 olarak güncellendi.');
    }

    // 4. AndroidManifest Onarımı
    if (fs.existsSync(manifestPath)) {
        let content = fs.readFileSync(manifestPath, 'utf8');
        content = content.replace(/<uses-permission[^>]*\/>/g, '');
        const permissions = [
            'android.permission.ACCESS_COARSE_LOCATION',
            'android.permission.ACCESS_FINE_LOCATION',
            'android.permission.INTERNET',
            'android.permission.VIBRATE',
            'android.permission.POST_NOTIFICATIONS',
            'com.google.android.gms.permission.AD_ID'
        ];
        const permissionTags = permissions.map(p => `    <uses-permission android:name="${p}" />`).join('\n');
        content = content.replace(/<application/, `${permissionTags}\n\n    <application`);
        fs.writeFileSync(manifestPath, content);
        console.log('✅ AndroidManifest.xml onarıldı.');
    }

    console.log('🎉 Android hazırlıkları tamamlandı.');
}

main();
