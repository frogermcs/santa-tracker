// ============================================================================
// M5CanvasSim.ts — 1:1 LovyanGFX / M5Canvas Simulation Runtime
// ============================================================================
// Mirrors the C++ M5Canvas API surface over HTML5 CanvasRenderingContext2D
// with integer coordinate truncation, sub-pixel stroke alignment, and RGB565 math.

import {
  TL_DATUM,
  TC_DATUM,
  TR_DATUM,
  ML_DATUM,
  MC_DATUM,
  MR_DATUM,
  BL_DATUM,
  BC_DATUM,
  BR_DATUM,
  TFT_WHITE,
  toCssColor,
} from "./M5Constants";

// Base64-encoded Adafruit / LovyanGFX Font 0 (GLCD 5x7 font)
const GLCD_FONT_B64 =
  "AAAAAAA+W09bPj5rT2s+HD58PhwYPH48GBxXfVccHF5/XhwAGDwYAP/nw+f/ABgkGAD/59vn/zBIOgYOJil5KSZAfwUFB0B/BSU/WjznPFp/PhwcCAgcHD5/FCJ/IhRfXwBfXwYJfwF/AGaJlWpgYGBgYJSi/6KUCAR+BAgQIH4gEAgIKhwICBwqCAgeEBAQEAweDB4MMDg+ODAGDj4OBgAAAAAAAABfAAAABwAHABR/FH8UJCp/KhIjEwhkYjZJViBQAAgHAwAAHCJBAABBIhwAKhx/HCoICD4ICACAcDAACAgICAgAAGBgACAQCAQCPlFJRT4AQn9AAHJJSUlGIUFJTTMYFBJ/ECdFRUU5PEpJSTFBIREJBzZJSUk2RklJKR4AABQAAABANAAAAAgUIkEUFBQUFABBIhQIAgFZCQY+QV1ZTnwSERJ8f0lJSTY+QUFBIn9BQUE+f0lJSUF/CQkJAT5BQVFzfwgICH8AQX9BACBAQT8BfwgUIkF/QEBAQH8CHAJ/fwQIEH8+QUFBPn8JCQkGPkFRIV5/CRkpRiZJSUkyAwF/AQM/QEBAPx8gQCAfP0A4QD9jFAgUYwMEeAQDYVlJTUMAf0FBQQIECBAgAEFBQX8EAgECBEBAQEBAAAMHCAAgVFR4QH8oREQ4OERERCg4REQofzhUVFQYAAh+CQIYpKSceH8IBAR4AER9QAAgQEA9AH8QKEQAAEF/QAB8BHgEeHwIBAR4OERERDj8GCQkGBgkJBj8fAgEBAhIVFRUJAQEP0QkPEBAIHwcIEAgHDxAMEA8RCgQKERMkJCQfERkVExEAAg2QQAAAHcAAABBNggAAgECBAI8JiMmPB6hoWESOkBAIHo4VFRVWSFVVXlBIlRUeEIhVVR4QCBUVXlADB5SchI5VVVVWTlUVFRZOVVUVFgAAEV8QQACRX1CAAFFfEB9EhESffAoJSjwfFRVRQAgVFR8VHwKCX9JMklJSTI6REREOjJKSEgwOkFBIXo6QkAgeACdoKB9PUJCQj09QEBAPTwk/yQkSH5JQ2YrL/wvK/8JKfYgwIh+CQMgVFR5QQAARH1BMEhISjI4QEAiegB6CgpyfQ0ZMX0mKSkvKCYpKSkmMEhNQCA4CAgICAgICAg4LxDIrLovECg0+gAAewAACBQqFCIiFCoUCFUAVQBVqlWqVar/Vf9V/wAAAP8AEBAQ/wAUFBT/ABAQ/wD/EBDwEPAUFBT8ABQU9wD/AAD/AP8UFPQE/BQUFxAfEBAfEB8UFBQfABAQEPAAAAAAHxAQEBAfEBAQEPAQAAAA/xAQEBAQEBAQEP8QAAAA/xQAAP8A/wAAHxAXAAD8BPQUFBcQFxQU9AT0AAD/APcUFBQUFBQU9wD3FBQUFxQQEB8QHxQUFPQUEBDwEPAAAB8QHwAAAB8UAAAA/BQAAPAQ8BAQ/xD/FBQU/xQQEBAfAAAAAPAQ///////w8PDw8P///wAAAAAA//8PDw8PDzhERDhE/EpKSjR+AgIGBgJ+An4CY1VJQWM4REQ8BEB+IB4gBgJ+AgKZpeelmRwqSSocTHIBckwwSk1NMDBIeEgwvGJaRj0+SUlJAH4BAQF+KioqKipERF9EREBRSkRAQERKUUAAAP8BA+CA/wAACAhrawg2EjYkNgYPCQ8GAAAYGAAAABAQADBA/wEBAB8BAR4AGR0XEgA8PDw8AAAAAAA=";

let glcdFontBytes: Uint8Array | null = null;
function getGlcdBytes(): Uint8Array {
  if (glcdFontBytes) return glcdFontBytes;
  if (typeof atob !== "undefined") {
    const bin = atob(GLCD_FONT_B64);
    glcdFontBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      glcdFontBytes[i] = bin.charCodeAt(i);
    }
  } else {
    glcdFontBytes = new Uint8Array(Buffer.from(GLCD_FONT_B64, "base64"));
  }
  return glcdFontBytes;
}

export class M5CanvasSim {
  private ctx: CanvasRenderingContext2D;
  private canvasElement: HTMLCanvasElement;
  private spriteWidth = 240;
  private spriteHeight = 135;
  private rotation: 0 | 1 | 2 | 3 = 1;

  // Text state
  private textDatum: number = TL_DATUM;
  private textFgColor: number | string = TFT_WHITE;
  private textBgColor: number | string | null = null;
  private textSize: number = 1;
  private cursorX: number = 0;
  private cursorY: number = 0;

  constructor(ctx: CanvasRenderingContext2D, canvasElement: HTMLCanvasElement) {
    this.ctx = ctx;
    this.canvasElement = canvasElement;
    this.spriteWidth = canvasElement.width || 240;
    this.spriteHeight = canvasElement.height || 135;
    this.ctx.imageSmoothingEnabled = false;
  }

  // ==========================================================================
  // Buffer & Lifecycle
  // ==========================================================================

  public createSprite(w: number, h: number): void {
    this.spriteWidth = Math.floor(w);
    this.spriteHeight = Math.floor(h);
    if (this.canvasElement.width !== this.spriteWidth || this.canvasElement.height !== this.spriteHeight) {
      this.canvasElement.width = this.spriteWidth;
      this.canvasElement.height = this.spriteHeight;
    }
    this.ctx.imageSmoothingEnabled = false;
  }

  public setRotation(rotation: 0 | 1 | 2 | 3): void {
    this.rotation = rotation;
    // 0: Portrait (135x240), 1: Landscape (240x135), 2: Inverted Portrait, 3: Inverted Landscape
    const isLandscape = this.rotation === 1 || this.rotation === 3;
    const targetW = isLandscape ? 240 : 135;
    const targetH = isLandscape ? 135 : 240;
    this.createSprite(targetW, targetH);
  }

  public getRotation(): 0 | 1 | 2 | 3 {
    return this.rotation;
  }

  public fillScreen(color: number | string): void {
    this.ctx.fillStyle = toCssColor(color);
    this.ctx.fillRect(0, 0, this.spriteWidth, this.spriteHeight);
  }

  public fillSprite(color: number | string): void {
    this.fillScreen(color);
  }

  public pushSprite(_x = 0, _y = 0): void {
    // In HTML5 2D canvas, drawing directly to ctx is immediate;
    // this stub is preserved so C++ draw loops compile and run 1:1.
    void _x;
    void _y;
  }

  public width(): number {
    return this.spriteWidth;
  }

  public height(): number {
    return this.spriteHeight;
  }

  // ==========================================================================
  // Drawing Primitives
  // ==========================================================================

  public drawPixel(x: number, y: number, color?: number | string): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.spriteWidth || iy < 0 || iy >= this.spriteHeight) return;
    this.ctx.fillStyle = toCssColor(color !== undefined ? color : this.textFgColor);
    this.ctx.fillRect(ix, iy, 1, 1);
  }

  public drawFastHLine(x: number, y: number, w: number, color?: number | string): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iw = Math.floor(w);
    if (iw <= 0) return;
    this.ctx.fillStyle = toCssColor(color !== undefined ? color : this.textFgColor);
    this.ctx.fillRect(ix, iy, iw, 1);
  }

  public drawFastVLine(x: number, y: number, h: number, color?: number | string): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const ih = Math.floor(h);
    if (ih <= 0) return;
    this.ctx.fillStyle = toCssColor(color !== undefined ? color : this.textFgColor);
    this.ctx.fillRect(ix, iy, 1, ih);
  }

  public drawLine(x0: number, y0: number, x1: number, y1: number, color?: number | string): void {
    const ix0 = Math.floor(x0);
    const iy0 = Math.floor(y0);
    const ix1 = Math.floor(x1);
    const iy1 = Math.floor(y1);

    if (iy0 === iy1) {
      const minX = Math.min(ix0, ix1);
      const w = Math.abs(ix1 - ix0) + 1;
      this.drawFastHLine(minX, iy0, w, color);
      return;
    }
    if (ix0 === ix1) {
      const minY = Math.min(iy0, iy1);
      const h = Math.abs(iy1 - iy0) + 1;
      this.drawFastVLine(ix0, minY, h, color);
      return;
    }

    // Sub-pixel +0.5 offset for sharp diagonal stroke lines
    this.ctx.strokeStyle = toCssColor(color !== undefined ? color : this.textFgColor);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(ix0 + 0.5, iy0 + 0.5);
    this.ctx.lineTo(ix1 + 0.5, iy1 + 0.5);
    this.ctx.stroke();
  }

  public drawRect(x: number, y: number, w: number, h: number, color?: number | string): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iw = Math.floor(w);
    const ih = Math.floor(h);
    if (iw <= 0 || ih <= 0) return;

    // Drawn with 4 discrete 1px edges to prevent any browser stroke antialiasing blur
    this.drawFastHLine(ix, iy, iw, color);
    this.drawFastHLine(ix, iy + ih - 1, iw, color);
    this.drawFastVLine(ix, iy, ih, color);
    this.drawFastVLine(ix + iw - 1, iy, ih, color);
  }

  public fillRect(x: number, y: number, w: number, h: number, color?: number | string): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iw = Math.floor(w);
    const ih = Math.floor(h);
    if (iw <= 0 || ih <= 0) return;
    this.ctx.fillStyle = toCssColor(color !== undefined ? color : this.textFgColor);
    this.ctx.fillRect(ix, iy, iw, ih);
  }

  public drawRoundRect(x: number, y: number, w: number, h: number, r: number, color?: number | string): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iw = Math.floor(w);
    const ih = Math.floor(h);
    const ir = Math.floor(r);

    this.ctx.strokeStyle = toCssColor(color !== undefined ? color : this.textFgColor);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1, ir);
    this.ctx.stroke();
  }

  public fillRoundRect(x: number, y: number, w: number, h: number, r: number, color?: number | string): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iw = Math.floor(w);
    const ih = Math.floor(h);
    const ir = Math.floor(r);

    this.ctx.fillStyle = toCssColor(color !== undefined ? color : this.textFgColor);
    this.ctx.beginPath();
    this.ctx.roundRect(ix, iy, iw, ih, ir);
    this.ctx.fill();
  }

  public drawCircle(x: number, y: number, r: number, color?: number | string): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const ir = Math.floor(r);
    if (ir <= 0) {
      this.drawPixel(ix, iy, color);
      return;
    }

    this.ctx.strokeStyle = toCssColor(color !== undefined ? color : this.textFgColor);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(ix + 0.5, iy + 0.5, ir, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  public fillCircle(x: number, y: number, r: number, color?: number | string): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const ir = Math.floor(r);
    if (ir <= 0) {
      this.drawPixel(ix, iy, color);
      return;
    }

    this.ctx.fillStyle = toCssColor(color !== undefined ? color : this.textFgColor);
    this.ctx.beginPath();
    this.ctx.arc(ix, iy, ir, 0, Math.PI * 2);
    this.ctx.fill();
  }

  public drawTriangle(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    color?: number | string
  ): void {
    this.drawLine(x0, y0, x1, y1, color);
    this.drawLine(x1, y1, x2, y2, color);
    this.drawLine(x2, y2, x0, y0, color);
  }

  public fillTriangle(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    color?: number | string
  ): void {
    this.ctx.fillStyle = toCssColor(color !== undefined ? color : this.textFgColor);
    this.ctx.beginPath();
    this.ctx.moveTo(Math.floor(x0), Math.floor(y0));
    this.ctx.lineTo(Math.floor(x1), Math.floor(y1));
    this.ctx.lineTo(Math.floor(x2), Math.floor(y2));
    this.ctx.closePath();
    this.ctx.fill();
  }

  // ==========================================================================
  // Typography & Datums (LovyanGFX Font 0 Parity)
  // ==========================================================================

  public setTextDatum(datum: number): void {
    this.textDatum = datum;
  }

  public getTextDatum(): number {
    return this.textDatum;
  }

  public setTextColor(fg: number | string, bg?: number | string): void {
    this.textFgColor = fg;
    this.textBgColor = bg !== undefined ? bg : null;
  }

  public setTextSize(size: number): void {
    this.textSize = Math.max(1, Math.floor(size));
  }

  public getTextSize(): number {
    return this.textSize;
  }

  public setCursor(x: number, y: number): void {
    this.cursorX = Math.floor(x);
    this.cursorY = Math.floor(y);
  }

  public textWidth(text: string): number {
    return text.length * 6 * this.textSize;
  }

  public fontHeight(): number {
    return 8 * this.textSize;
  }

  /**
   * Draws a string at the specified coordinates taking text datum alignment
   * and optional background bounding fill into account.
   */
  public drawString(text: string, x: number, y: number): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const scale = this.textSize;
    const charW = 6 * scale;
    const fontH = 8 * scale;
    const totalW = text.length * charW;

    let startX = ix;
    let startY = iy;

    // Horizontal Datum
    if (this.textDatum === TR_DATUM || this.textDatum === MR_DATUM || this.textDatum === BR_DATUM) {
      startX = ix - totalW;
    } else if (this.textDatum === TC_DATUM || this.textDatum === MC_DATUM || this.textDatum === BC_DATUM) {
      startX = ix - Math.floor(totalW / 2);
    }

    // Vertical Datum
    if (this.textDatum === BL_DATUM || this.textDatum === BC_DATUM || this.textDatum === BR_DATUM) {
      startY = iy - fontH;
    } else if (this.textDatum === ML_DATUM || this.textDatum === MC_DATUM || this.textDatum === MR_DATUM) {
      startY = iy - Math.floor(fontH / 2);
    }

    // Draw solid background box if bg color is defined (LovyanGFX behavior)
    if (this.textBgColor !== null) {
      this.ctx.fillStyle = toCssColor(this.textBgColor);
      this.ctx.fillRect(startX, startY, totalW, fontH);
    }

    // Render characters via Font 0 bitmap rasterizer
    const fontBytes = getGlcdBytes();
    this.ctx.fillStyle = toCssColor(this.textFgColor);

    for (let c = 0; c < text.length; c++) {
      const code = text.charCodeAt(c);
      if (code >= 0 && code < 256) {
        const fontOffset = code * 5;
        const charX = startX + c * charW;

        for (let col = 0; col < 5; col++) {
          const colByte = fontBytes[fontOffset + col];
          for (let row = 0; row < 8; row++) {
            if ((colByte >> row) & 1) {
              this.ctx.fillRect(charX + col * scale, startY + row * scale, scale, scale);
            }
          }
        }
      }
    }

    this.cursorX = startX + totalW;
    this.cursorY = startY;
  }

  public drawCenterString(text: string, x: number, y: number): void {
    const prevDatum = this.textDatum;
    this.textDatum = TC_DATUM;
    this.drawString(text, x, y);
    this.textDatum = prevDatum;
  }

  public drawRightString(text: string, x: number, y: number): void {
    const prevDatum = this.textDatum;
    this.textDatum = TR_DATUM;
    this.drawString(text, x, y);
    this.textDatum = prevDatum;
  }

  // ==========================================================================
  // Bitmaps / Sprites (Standard 1-bit PROGMEM Array Parity)
  // ==========================================================================

  /**
   * Renders 1-bit XBM/PROGMEM byte arrays identically to C++
   * bitmap: array of uint8 bytes, row-major, 1 bit per pixel (MSB first).
   */
  public drawBitmap(
    x: number,
    y: number,
    bitmap: number[] | Uint8Array,
    w: number,
    h: number,
    fgColor: number | string,
    bgColor?: number | string
  ): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iw = Math.floor(w);
    const ih = Math.floor(h);
    const byteWidth = Math.floor((iw + 7) / 8);

    const fgCss = toCssColor(fgColor);
    const bgCss = bgColor !== undefined ? toCssColor(bgColor) : null;

    for (let row = 0; row < ih; row++) {
      for (let col = 0; col < iw; col++) {
        const byteIndex = row * byteWidth + Math.floor(col / 8);
        const byte = bitmap[byteIndex] || 0;
        const bit = (byte & (0x80 >> (col & 7))) !== 0;

        if (bit) {
          this.ctx.fillStyle = fgCss;
          this.ctx.fillRect(ix + col, iy + row, 1, 1);
        } else if (bgCss !== null) {
          this.ctx.fillStyle = bgCss;
          this.ctx.fillRect(ix + col, iy + row, 1, 1);
        }
      }
    }
  }
}
