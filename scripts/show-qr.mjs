import QRCode from 'qrcode';

const PORTAL_URL = 'https://adk113.github.io/MyOwnVault/download.html';
const APK_URL = 'https://github.com/adk113/MyOwnVault/releases/download/v1.0.0/MyOwnVault.apk';
const IOS_URL = 'https://adk113.github.io/MyOwnVault/';

async function printQRCodes() {
  console.log('\n======================================================');
  console.log('🌐 UNIVERSAL DOWNLOAD PORTAL (Auto-detects Android & iOS)');
  console.log('URL: ' + PORTAL_URL);
  console.log('======================================================');
  const qrPortal = await QRCode.toString(PORTAL_URL, { type: 'terminal', small: true });
  console.log(qrPortal);

  console.log('\n======================================================');
  console.log('🤖 ANDROID STANDALONE APK (Direct Download & Install)');
  console.log('URL: ' + APK_URL);
  console.log('======================================================');
  const qrAndroid = await QRCode.toString(APK_URL, { type: 'terminal', small: true });
  console.log(qrAndroid);

  console.log('\n======================================================');
  console.log('🍏 APPLE iOS TESTING DISTRIBUTION (Safari PWA)');
  console.log('URL: ' + IOS_URL);
  console.log('======================================================');
  const qrIos = await QRCode.toString(IOS_URL, { type: 'terminal', small: true });
  console.log(qrIos);
}

printQRCodes().catch(console.error);
