import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const downloadPortalUrl = 'https://adk113.github.io/MyOwnVault/download.html';
const iosUrl = 'https://adk113.github.io/MyOwnVault/';
const androidApkUrl = 'https://github.com/adk113/MyOwnVault/releases/download/v1.0.0/MyOwnVault.apk';
const pwaUrl = 'https://adk113.github.io/MyOwnVault/';

async function main() {
  // 1. Universal Download Portal QR code (Detects Android & iOS)
  const universalSvg = await QRCode.toString(downloadPortalUrl, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#030712',
      light: '#ffffff'
    }
  });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'qr-download.svg'), universalSvg);
  await QRCode.toFile(path.join(PUBLIC_DIR, 'qr-download.png'), downloadPortalUrl, { width: 400, margin: 2 });
  console.log('✓ Generated qr-download.svg and qr-download.png (Universal)');

  // 2. iOS Safari PWA QR code
  const iosSvg = await QRCode.toString(iosUrl, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#030712',
      light: '#ffffff'
    }
  });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'qr-ios.svg'), iosSvg);
  await QRCode.toFile(path.join(PUBLIC_DIR, 'qr-ios.png'), iosUrl, { width: 400, margin: 2 });
  console.log('✓ Generated qr-ios.svg and qr-ios.png');

  // 3. Android Direct APK Download QR code
  const androidSvg = await QRCode.toString(androidApkUrl, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#022c22', // emerald tint for Android
      light: '#ffffff'
    }
  });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'qr-android-apk.svg'), androidSvg);
  await QRCode.toFile(path.join(PUBLIC_DIR, 'qr-android-apk.png'), androidApkUrl, { width: 400, margin: 2 });
  console.log('✓ Generated qr-android-apk.svg and qr-android-apk.png');

  // 4. Android PWA (1-Tap Install without APK)
  const androidPwaSvg = await QRCode.toString(pwaUrl, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#064e3b',
      light: '#ffffff'
    }
  });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'qr-android-pwa.svg'), androidPwaSvg);
  console.log('✓ Generated qr-android-pwa.svg');
}

main().catch(console.error);
