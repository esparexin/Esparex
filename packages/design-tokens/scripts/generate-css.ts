import * as fs from 'fs';
import * as path from 'path';
import { colors } from '../src/colors';
import { radius } from '../src/radius';

// Helper to convert hex to HSL (Tailwind format: "H S% L%")
function hexToHsl(hex: string): string {
  if (hex.startsWith('var(') || hex === 'transparent' || hex === 'currentColor') {
    return hex;
  }
  
  // Remove hash
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360 * 10) / 10;
  s = Math.round(s * 100 * 10) / 10;
  l = Math.round(l * 100 * 10) / 10;

  return `${h} ${s}% ${l}%`;
}

function generateCss() {
  let css = `/* GENERATED FILE - DO NOT EDIT MANUALLY */\n`;
  css += `/* Source: @esparex/design-tokens */\n\n`;
  
  // Generate Light Mode variables
  css += `:root {\n`;
  
  for (const [key, value] of Object.entries(colors.semantic.light)) {
    css += `    --${key}: ${hexToHsl(value as string)};\n`;
  }
  
  // Hardcoded radius to preserve current globals.css behavior (usually handled by tokens, but globals uses rem for border-radius base)
  css += `    --radius: 0.5rem;\n`;

  css += `}\n\n`;
  
  // Generate Dark Mode variables
  css += `.dark {\n`;
  for (const [key, value] of Object.entries(colors.semantic.dark)) {
    css += `    --${key}: ${hexToHsl(value as string)};\n`;
  }
  css += `}\n`;
  
  const distDir = path.join(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(distDir, 'css-variables.css'), css, 'utf8');
  console.log('✅ Generated packages/design-tokens/dist/css-variables.css');
}

generateCss();
