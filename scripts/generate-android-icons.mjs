import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const SOURCE_ICON = path.join(ROOT, 'public', 'app-icon.png');
const RES_DIR = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

if (!fs.existsSync(SOURCE_ICON)) {
  console.error(`Source icon not found at: ${SOURCE_ICON}`);
  process.exit(1);
}

const densities = [
  { folder: 'mipmap-mdpi', launcherSize: 48, foregroundSize: 108 },
  { folder: 'mipmap-hdpi', launcherSize: 72, foregroundSize: 162 },
  { folder: 'mipmap-xhdpi', launcherSize: 96, foregroundSize: 216 },
  { folder: 'mipmap-xxhdpi', launcherSize: 144, foregroundSize: 324 },
  { folder: 'mipmap-xxxhdpi', launcherSize: 192, foregroundSize: 432 },
];

console.log(`Generating Android icons from: ${path.relative(ROOT, SOURCE_ICON)}`);

for (const { folder, launcherSize, foregroundSize } of densities) {
  const dir = path.join(RES_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const launcherPng = path.join(dir, 'ic_launcher.png');
  const launcherRoundPng = path.join(dir, 'ic_launcher_round.png');
  const foregroundPng = path.join(dir, 'ic_launcher_foreground.png');

  // Generate ic_launcher.png
  execSync(`sips -z ${launcherSize} ${launcherSize} "${SOURCE_ICON}" --out "${launcherPng}"`, { stdio: 'pipe' });
  // Generate ic_launcher_round.png
  execSync(`sips -z ${launcherSize} ${launcherSize} "${SOURCE_ICON}" --out "${launcherRoundPng}"`, { stdio: 'pipe' });
  // Generate ic_launcher_foreground.png
  execSync(`sips -z ${foregroundSize} ${foregroundSize} "${SOURCE_ICON}" --out "${foregroundPng}"`, { stdio: 'pipe' });

  console.log(`✓ Updated ${folder} (launcher: ${launcherSize}x${launcherSize}, foreground: ${foregroundSize}x${foregroundSize})`);
}

// Also update background color in values/ic_launcher_background.xml
const bgXmlPath = path.join(RES_DIR, 'values', 'ic_launcher_background.xml');
const bgXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#030712</color>
</resources>
`;
fs.writeFileSync(bgXmlPath, bgXmlContent, 'utf-8');
// Also ensure Expo assets directory is kept in sync
const ASSETS_DIR = path.join(ROOT, 'assets');
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
fs.copyFileSync(SOURCE_ICON, path.join(ASSETS_DIR, 'icon.png'));
fs.copyFileSync(SOURCE_ICON, path.join(ASSETS_DIR, 'adaptive-icon.png'));
fs.copyFileSync(SOURCE_ICON, path.join(ASSETS_DIR, 'splash.png'));
const favPng = path.join(ROOT, 'public', 'favicon.png');
if (fs.existsSync(favPng)) fs.copyFileSync(favPng, path.join(ASSETS_DIR, 'favicon.png'));
console.log('✓ Synced Expo assets folder (icon.png, adaptive-icon.png, splash.png, favicon.png)');

console.log('All Android and Expo assets generated successfully!');

