import sharp from 'sharp';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
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
  private fontFamily: string = 'NotoSansThai';
  private fontReady: boolean = false;

  constructor() {
    const fontPaths = [
      path.join(__dirname, '../../fonts/NotoSansThai-Bold.ttf'),
      path.join(process.cwd(), 'apps/api/fonts/NotoSansThai-Bold.ttf'),
    ];

    for (const p of fontPaths) {
      if (fs.existsSync(p)) {
        const result = GlobalFonts.registerFromPath(p, this.fontFamily);
        if (result) {
          console.log(`Thai font registered from: ${p}`);
          this.fontReady = true;
        } else {
          console.warn(`Failed to register font from: ${p}`);
        }
        break;
      }
    }

    if (!this.fontReady) {
      console.warn('Thai font not found or failed to register, text rendering may use fallback font');
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

    // 1. Create background using sharp (SVG gradient or user image)
    let bgBuffer: Buffer;

    if (backgroundImage) {
      try {
        const base64Data = backgroundImage.includes(',')
          ? backgroundImage.split(',')[1]
          : backgroundImage;
        const rawBg = Buffer.from(base64Data, 'base64');

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

    // 2. Create text overlay using @napi-rs/canvas
    const textBuffer = this.renderTextCanvas(title, width, height, fontSize, textColor);

    // 3. Composite background + text using sharp
    const imageBuffer = await sharp(bgBuffer)
      .composite([{
        input: textBuffer,
        left: 0,
        top: 0,
      }])
      .png()
      .toBuffer();

    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  private renderTextCanvas(
    title: string,
    width: number,
    height: number,
    fontSize: number,
    textColor: string,
  ): Buffer {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Setup font
    const fontName = this.fontReady ? this.fontFamily : 'Arial';
    ctx.font = `bold ${fontSize}px ${fontName}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Word wrap
    const maxWidth = width * 0.85;
    const lines = this.wrapText(ctx, title, maxWidth);
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    const startY = (height - totalHeight) / 2 + lineHeight / 2;

    // Draw drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], width / 2 + 2, startY + i * lineHeight + 3);
    }

    // Draw text
    ctx.fillStyle = textColor;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], width / 2, startY + i * lineHeight);
    }

    return Buffer.from(canvas.toBuffer('image/png'));
  }

  private wrapText(
    ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
    text: string,
    maxWidth: number,
  ): string[] {
    const words = text.split(/(\s+)/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    return lines.slice(0, 4);
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
