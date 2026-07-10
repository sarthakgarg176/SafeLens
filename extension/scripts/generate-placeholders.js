import fs from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base64 encoding of a 1x1 transparent PNG file
const PNG_1X1_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const iconsDir = resolve(__dirname, '../public/icons');

// Ensure public/icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate the three manifest-required PNG files
const targets = ['icon16.png', 'icon48.png', 'icon128.png'];
const pngBuffer = Buffer.from(PNG_1X1_BASE64, 'base64');

targets.forEach((iconName) => {
  const filePath = resolve(iconsDir, iconName);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`Generated placeholder icon: public/icons/${iconName}`);
});

console.log('Icon placeholder generation complete!');
