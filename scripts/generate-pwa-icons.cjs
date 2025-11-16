#!/usr/bin/env node

/**
 * Generate placeholder PWA icons
 *
 * This script creates simple SVG-based placeholder icons for the PWA.
 * For production, replace these with professionally designed icons.
 *
 * You can use tools like:
 * - https://www.pwabuilder.com/ - Generate icons automatically
 * - https://realfavicongenerator.net/ - Generate all icon sizes
 * - Figma/Sketch/Adobe XD - Design custom icons
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Simple SVG icon template with "A" for Aura
const createSVGIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6d28d9;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.1}"/>
  <text
    x="50%"
    y="50%"
    font-family="Arial, sans-serif"
    font-size="${size * 0.6}"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="central">A</text>
</svg>`;

// For now, create SVG files as placeholders
// Note: PWAs prefer PNG, but SVG can work in many browsers
const sizes = [
  { name: 'pwa-64x64.svg', size: 64 },
  { name: 'pwa-192x192.svg', size: 192 },
  { name: 'pwa-512x512.svg', size: 512 },
  { name: 'maskable-icon-512x512.svg', size: 512 }
];

console.log('📱 Generating PWA icon placeholders...\n');

sizes.forEach(({ name, size }) => {
  const svgContent = createSVGIcon(size);
  const filePath = path.join(publicDir, name);

  fs.writeFileSync(filePath, svgContent);
  console.log(`✓ Created ${name} (${size}x${size})`);
});

console.log('\n✨ Icon placeholders created!');
console.log('\n⚠️  IMPORTANT: These are SVG placeholders.');
console.log('   For production, generate proper PNG icons using:');
console.log('   - https://www.pwabuilder.com/ (Recommended)');
console.log('   - https://realfavicongenerator.net/');
console.log('   - Or convert the SVGs to PNGs using an image editor\n');
