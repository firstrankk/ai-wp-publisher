import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

interface GenerateImageParams {
  title: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  width?: number;
  height?: number;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number; // for linear gradient
  };
  backgroundImage?: string; // base64 image
}

export class ImageService {
  private fontBase64: string = '';

  constructor() {
    // Load Thai font as base64 for embedding in SVG
    const fontPaths = [
      path.join(__dirname, '../../fonts/NotoSansThai-Bold.ttf'),
      path.join(process.cwd(), 'apps/api/fonts/NotoSansThai-Bold.ttf'),
    ];

    for (const fontPath of fontPaths) {
      try {
        if (fs.existsSync(fontPath)) {
          this.fontBase64 = fs.readFileSync(fontPath).toString('base64');
          console.log(`Loaded Thai font from: ${fontPath}`);
          break;
        }
      } catch {
        // Try next path
      }
    }

    if (!this.fontBase64) {
      console.warn('Thai font not found, Thai text may not render correctly');
    }
  }

  private getFontFaceDef(): string {
    if (!this.fontBase64) return '';
    return `
      <style type="text/css">
        @font-face {
          font-family: 'NotoSansThai';
          src: url('data:font/truetype;base64,${this.fontBase64}') format('truetype');
          font-weight: bold;
          font-style: normal;
        }
      </style>
    `;
  }

  private getFontFamily(): string {
    return this.fontBase64
      ? "'NotoSansThai', 'Noto Sans Thai', Arial, sans-serif"
      : "Arial, sans-serif";
  }

  async generateFeaturedImage(params: GenerateImageParams): Promise<string> {
    const {
      title,
      backgroundColor = '#1a1a2e',
      textColor = '#ffffff',
      fontSize = 48,
      width = 1200,
      height = 630,
      gradient,
      backgroundImage,
    } = params;

    const fontFamily = this.getFontFamily();
    const fontFaceDef = this.getFontFaceDef();

    // Wrap text to multiple lines
    const maxCharsPerLine = Math.floor(width / (fontSize * 0.6));
    const lines = this.wrapText(title, maxCharsPerLine);
    const lineHeight = fontSize * 1.3;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (height - totalTextHeight) / 2 + fontSize;

    // Create text elements for SVG
    const textElements = lines
      .map((line, index) => {
        const y = startY + index * lineHeight;
        return `<text x="50%" y="${y}" text-anchor="middle" font-family="${fontFamily}" font-size="${fontSize}" font-weight="bold" fill="${textColor}">${this.escapeXml(line)}</text>`;
      })
      .join('');

    // Build gradient definition
    let gradientDef = '';
    let backgroundFill = '';

    if (gradient && gradient.colors && gradient.colors.length >= 2) {
      if (gradient.type === 'radial') {
        const stops = gradient.colors.map((color, i) =>
          `<stop offset="${(i / (gradient.colors.length - 1)) * 100}%" style="stop-color:${color};stop-opacity:1" />`
        ).join('');
        gradientDef = `<radialGradient id="grad" cx="50%" cy="50%" r="70%">${stops}</radialGradient>`;
      } else {
        const angle = gradient.angle || 135;
        const angleRad = (angle * Math.PI) / 180;
        const x2 = Math.round(50 + Math.cos(angleRad) * 50);
        const y2 = Math.round(50 + Math.sin(angleRad) * 50);
        const stops = gradient.colors.map((color, i) =>
          `<stop offset="${(i / (gradient.colors.length - 1)) * 100}%" style="stop-color:${color};stop-opacity:1" />`
        ).join('');
        gradientDef = `<linearGradient id="grad" x1="0%" y1="0%" x2="${x2}%" y2="${y2}%">${stops}</linearGradient>`;
      }
      backgroundFill = 'url(#grad)';
    } else {
      // Default simple gradient from backgroundColor
      gradientDef = `
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${this.darkenColor(backgroundColor, 20)};stop-opacity:1" />
        </linearGradient>
      `;
      backgroundFill = 'url(#grad)';
    }

    // If background image is provided, use custom background
    if (backgroundImage) {
      try {
        // Extract base64 data
        const base64Data = backgroundImage.includes(',')
          ? backgroundImage.split(',')[1]
          : backgroundImage;
        const bgBuffer = Buffer.from(base64Data, 'base64');

        // Resize background image
        const resizedBg = await sharp(bgBuffer)
          .resize(width, height, { fit: 'cover' })
          .toBuffer();

        // Create text-only SVG with transparent background
        const textOnlySvg = `
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              ${fontFaceDef}
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.5"/>
              </filter>
            </defs>
            <g filter="url(#shadow)">
              ${textElements}
            </g>
          </svg>
        `;

        const textOverlay = await sharp(Buffer.from(textOnlySvg))
          .png()
          .toBuffer();

        // Composite: background + dark overlay + text
        const imageBuffer = await sharp(resizedBg)
          .composite([
            {
              input: {
                create: {
                  width,
                  height,
                  channels: 4,
                  background: { r: 0, g: 0, b: 0, alpha: 0.5 },
                },
              },
            },
            { input: textOverlay },
          ])
          .png()
          .toBuffer();

        return `data:image/png;base64,${imageBuffer.toString('base64')}`;
      } catch (error) {
        console.error('Failed to process background image:', error);
        // Fall back to gradient background below
      }
    }

    // Create SVG with gradient/solid background
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${fontFaceDef}
          ${gradientDef}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="${backgroundFill}"/>
        <g filter="url(#shadow)">
          ${textElements}
        </g>
      </svg>
    `;

    // Convert SVG to PNG using sharp
    const imageBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    // Return as base64
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // Limit to 4 lines max
    return lines.slice(0, 4);
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private darkenColor(hex: string, percent: number): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Darken
    const factor = 1 - percent / 100;
    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  // Generate with different preset styles
  async generateWithPreset(
    title: string,
    preset: 'modern' | 'classic' | 'vibrant' | 'minimal'
  ): Promise<string> {
    const presets = {
      modern: { backgroundColor: '#1a1a2e', textColor: '#ffffff' },
      classic: { backgroundColor: '#2c3e50', textColor: '#ecf0f1' },
      vibrant: { backgroundColor: '#e74c3c', textColor: '#ffffff' },
      minimal: { backgroundColor: '#ffffff', textColor: '#2c3e50' },
    };

    return this.generateFeaturedImage({
      title,
      ...presets[preset],
    });
  }
}
