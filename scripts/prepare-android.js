
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const appBuildGradlePath = path.join(androidDir, 'app', 'build.gradle');
const androidResDir = path.join(androidDir, 'app', 'src', 'main', 'res');
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const variablesGradlePath = path.join(androidDir, 'variables.gradle');

const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const ADMOB_APP_ID = "ca-app-pub-4319080566007267~4413348107";
const LOCAL_ICON_PATH = path.join(rootDir, 'icon.png');

async function processIcons() {
    console.log('🎨 Android İkonları Yerel Dosyadan Hazırlanıyor...');
    if (!fs.existsSync(LOCAL_ICON_PATH)) {
        console.warn('   ⚠️ UYARI: "icon.png" bulunamadı, ikonlar güncellenmedi.');
        return;
    }

    try {
        const mipmapFolders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
        for (const folder of mipmapFolders) {
            const destFolder = path.join(androidResDir, folder);
            if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
            const targets = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];
            targets.forEach(t => {
                const destPath = path.join(destFolder, t);
                fs.copyFileSync(LOCAL_ICON_PATH, destPath);
            });
        }
        const anyDpiDir = path.join(androidResDir, 'mipmap-anydpi-v26');
        if (fs.existsSync(anyDpiDir)) {
            ['ic_launcher.xml', 'ic_launcher_round.xml'].forEach(file => {
                const filePath = path.join(anyDpiDir, file);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        }
        console.log('   ✅ İkonlar güncellendi.');
    } catch (err) {
        console.error('   ❌ İkon hatası:', err.message);
    }
}

function updateAndroidVersion() {
    if (!fs.existsSync(appBuildGradlePath)) return;

    console.log('🔢 Sürüm kodları güncelleniyor...');
    let content = fs.readFileSync(appBuildGradlePath, 'utf8');

    // versionCode'u bul ve artır
    const versionCodeMatch = content.match(/versionCode\s+(\d+)/);
    if (versionCodeMatch) {
        const currentCode = parseInt(versionCodeMatch[1]);
        const newCode = currentCode + 1;
        content = content.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
        console.log(`   ✅ versionCode: ${currentCode} -> ${newCode}`);
    }

    // versionName'i package.json ile eşitle
    content = content.replace(/versionName\s+"[^"]+"/, `versionName "${packageJson.version}"`);
    console.log(`   ✅ versionName: "${packageJson.version}"`);

    fs.writeFileSync(appBuildGradlePath, content);
}

async function main() {
    if (!fs.existsSync(androidDir)) {
        console.log('⚠️ Android klasörü bulunamadı.');
        return;
    }

    await processIcons();
    updateAndroidVersion();

    if (fs.existsSync(variablesGradlePath)) {
        let varsContent = fs.readFileSync(variablesGradlePath, 'utf8');
        varsContent = varsContent.replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 35');
        varsContent = varsContent.replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 35');
        varsContent = varsContent.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 24');
        fs.writeFileSync(variablesGradlePath, varsContent);
    }

    if (fs.existsSync(manifestPath)) {
        let content = fs.readFileSync(manifestPath, 'utf8');
        if (!content.includes('com.google.android.gms.ads.APPLICATION_ID')) {
            const adMobMeta = `\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${ADMOB_APP_ID}"/>`;
            content = content.replace('</application>', `${adMobMeta}\n    </application>`);
            fs.writeFileSync(manifestPath, content);
        }
    }
    
    console.log('🎉 Hazırlık tamamlandı.');
}

main();
