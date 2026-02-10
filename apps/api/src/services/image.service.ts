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
  private fontFilePath: string = '';

  constructor() {
    const fontPaths = [
      path.join(__dirname, '../../fonts/NotoSansThai-Bold.ttf'),
      path.join(process.cwd(), 'apps/api/fonts/NotoSansThai-Bold.ttf'),
    ];

    for (const p of fontPaths) {
      if (fs.existsSync(p)) {
        this.fontFilePath = p;
        console.log(`Thai font loaded from: ${p}`);
        break;
      }
    }

    if (!this.fontFilePath) {
      console.warn('Thai font not found, text rendering may fail');
    }
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

    // 1. Create background
    let bgBuffer: Buffer;

    if (backgroundImage) {
      try {
        const base64Data = backgroundImage.includes(',')
          ? backgroundImage.split(',')[1]
          : backgroundImage;
        const rawBg = Buffer.from(base64Data, 'base64');

        // Resize + dark overlay
        bgBuffer = await sharp(rawBg)
          .resize(width, height, { fit: 'cover' })
          .composite([{
            input: {
              create: {
                width,
                height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0.5 },
              },
            },
          }])
          .png()
          .toBuffer();
      } catch (error) {
        console.error('Failed to process background image:', error);
        bgBuffer = await this.createGradientBackground(width, height, backgroundColor, gradient);
      }
    } else {
      bgBuffer = await this.createGradientBackground(width, height, backgroundColor, gradient);
    }

    // 2. Create text overlay using sharp text API (uses Pango + fontfile directly)
    const pangoSize = fontSize * 1024; // Pango uses 1/1024 point units
    const escapedTitle = this.escapePango(title);

    const textOptions: sharp.CreateText = {
      text: `<span foreground="${textColor}" size="${pangoSize}">${escapedTitle}</span>`,
      width: Math.round(width * 0.85),
      align: 'centre',
      rgba: true,
      dpi: 72,
    };

    if (this.fontFilePath) {
      textOptions.fontfile = this.fontFilePath;
    }

    const textBuffer = await sharp({ text: textOptions }).png().toBuffer();

    // Get text dimensions for centering
    const textMeta = await sharp(textBuffer).metadata();
    const textW = textMeta.width || 0;
    const textH = textMeta.height || 0;

    // 3. Create drop shadow
    const shadowBuffer = await sharp(textBuffer)
      .blur(4)
      .modulate({ brightness: 0 })
      .ensureAlpha(0.4)
      .png()
      .toBuffer();

    // 4. Composite: background + shadow + text (centered)
    const centerX = Math.round((width - textW) / 2);
    const centerY = Math.round((height - textH) / 2);

    const imageBuffer = await sharp(bgBuffer)
      .composite([
        {
          input: shadowBuffer,
          left: centerX + 2,
          top: centerY + 3,
        },
        {
          input: textBuffer,
          left: centerX,
          top: centerY,
        },
      ])
      .png()
      .toBuffer();

    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  private async createGradientBackground(
    width: number,
    height: number,
    backgroundColor: string,
    gradient?: GenerateImageParams['gradient'],
  ): Promise<Buffer> {
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
      gradientDef = `
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${this.darkenColor(backgroundColor, 20)};stop-opacity:1" />
        </linearGradient>
      `;
      backgroundFill = 'url(#grad)';
    }

    const bgSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>${gradientDef}</defs>
      <rect width="100%" height="100%" fill="${backgroundFill}"/>
    </svg>`;

    return sharp(Buffer.from(bgSvg)).png().toBuffer();
  }

  private escapePango(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private darkenColor(hex: string, percent: number): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const factor = 1 - percent / 100;
    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

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
