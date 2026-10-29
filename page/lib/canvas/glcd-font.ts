// Exact 1:1 Hardware GlcdFont (M5GFX / Adafruit GFX Font0 5x7 bitmap)
// Matches physical M5StickC-Plus LCD bitmap typography with zero anti-aliasing blur.

const FONT_B64 = "AAAAAAA+W09bPj5rT2s+HD58PhwYPH48GBxXfVccHF5/XhwAGDwYAP/nw+f/ABgkGAD/59vn/zBIOgYOJil5KSZAfwUFB0B/BSU/WjznPFp/PhwcCAgcHD5/FCJ/IhRfXwBfXwYJfwF/AGaJlWpgYGBgYJSi/6KUCAR+BAgQIH4gEAgIKhwICBwqCAgeEBAQEAweDB4MMDg+ODAGDj4OBgAAAAAAAABfAAAABwAHABR/FH8UJCp/KhIjEwhkYjZJViBQAAgHAwAAHCJBAABBIhwAKhx/HCoICD4ICACAcDAACAgICAgAAGBgACAQCAQCPlFJRT4AQn9AAHJJSUlGIUFJTTMYFBJ/ECdFRUU5PEpJSTFBIREJBzZJSUk2RklJKR4AABQAAABANAAAAAgUIkEUFBQUFABBIhQIAgFZCQY+QV1ZTnwSERJ8f0lJSTY+QUFBIn9BQUE+f0lJSUF/CQkJAT5BQVFzfwgICH8AQX9BACBAQT8BfwgUIkF/QEBAQH8CHAJ/fwQIEH8+QUFBPn8JCQkGPkFRIV5/CRkpRiZJSUkyAwF/AQM/QEBAPx8gQCAfP0A4QD9jFAgUYwMEeAQDYVlJTUMAf0FBQQIECBAgAEFBQX8EAgECBEBAQEBAAAMHCAAgVFR4QH8oREQ4OERERCg4REQofzhUVFQYAAh+CQIYpKSceH8IBAR4AER9QAAgQEA9AH8QKEQAAEF/QAB8BHgEeHwIBAR4OERERDj8GCQkGBgkJBj8fAgEBAhIVFRUJAQEP0QkPEBAIHwcIEAgHDxAMEA8RCgQKERMkJCQfERkVExEAAg2QQAAAHcAAABBNggAAgECBAI8JiMmPB6hoWESOkBAIHo4VFRVWSFVVXlBIlRUeEIhVVR4QCBUVXlADB5SchI5VVVVWTlUVFRZOVVUVFgAAEV8QQACRX1CAAFFfEB9EhESffAoJSjwfFRVRQAgVFR8VHwKCX9JMklJSTI6REREOjJKSEgwOkFBIXo6QkAgeACdoKB9PUJCQj09QEBAPTwk/yQkSH5JQ2YrL/wvK/8JKfYgwIh+CQMgVFR5QQAARH1BMEhISjI4QEAiegB6CgpyfQ0ZMX0mKSkvKCYpKSkmMEhNQCA4CAgICAgICAg4LxDIrLovECg0+gAAewAACBQqFCIiFCoUCFUAVQBVqlWqVar/Vf9V/wAAAP8AEBAQ/wAUFBT/ABAQ/wD/EBDwEPAUFBT8ABQU9wD/AAD/AP8UFPQE/BQUFxAfEBAfEB8UFBQfABAQEPAAAAAAHxAQEBAfEBAQEPAQAAAA/xAQEBAQEBAQEP8QAAAA/xQAAP8A/wAAHxAXAAD8BPQUFBcQFxQU9AT0AAD/APcUFBQUFBQU9wD3FBQUFxQQEB8QHxQUFPQUEBDwEPAAAB8QHwAAAB8UAAAA/BQAAPAQ8BAQ/xD/FBQU/xQQEBAfAAAAAPAQ///////w8PDw8P///wAAAAAA//8PDw8PDzhERDhE/EpKSjR+AgIGBgJ+An4CY1VJQWM4REQ8BEB+IB4gBgJ+AgKZpeelmRwqSSocTHIBckwwSk1NMDBIeEgwvGJaRj0+SUlJAH4BAQF+KioqKipERF9EREBRSkRAQERKUUAAAP8BA+CA/wAACAhrawg2EjYkNgYPCQ8GAAAYGAAAABAQADBA/wEBAB8BAR4AGR0XEgA8PDw8AAAAAAA=";
let fontBytes: Uint8Array | null = null;

function getFontBytes(): Uint8Array {
  if (fontBytes) return fontBytes;
  if (typeof atob !== "undefined") {
    const bin = atob(FONT_B64);
    fontBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      fontBytes[i] = bin.charCodeAt(i);
    }
  } else {
    fontBytes = new Uint8Array(Buffer.from(FONT_B64, "base64"));
  }
  return fontBytes;
}

// Normalize Polish diacritics to standard ASCII
function normalizeAscii(str: string): string {
  return str
    .replace(/[Ą]/g, "A")
    .replace(/[Ć]/g, "C")
    .replace(/[Ę]/g, "E")
    .replace(/[Ł]/g, "L")
    .replace(/[Ń]/g, "N")
    .replace(/[Ó]/g, "O")
    .replace(/[Ś]/g, "S")
    .replace(/[ŹŻ]/g, "Z")
    .replace(/[ą]/g, "a")
    .replace(/[ć]/g, "c")
    .replace(/[ę]/g, "e")
    .replace(/[ł]/g, "l")
    .replace(/[ń]/g, "n")
    .replace(/[ó]/g, "o")
    .replace(/[ś]/g, "s")
    .replace(/[źż]/g, "z");
}

export function drawBitmapText(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  x: number,
  y: number,
  color: string,
  align: "left" | "right" | "center" = "left",
  scale = 1
): number {
  const text = normalizeAscii(rawText);
  const data = getFontBytes();
  const charWidth = 6 * scale; // 5px glyph + 1px spacing
  const totalWidth = text.length * charWidth;

  let startX = Math.round(x);
  if (align === "right") {
    startX = Math.round(x - totalWidth);
  } else if (align === "center") {
    startX = Math.round(x - totalWidth / 2);
  }

  ctx.fillStyle = color;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0 && code < 256) {
      const fontOffset = code * 5;
      const charX = Math.round(startX + i * charWidth);

      for (let col = 0; col < 5; col++) {
        const line = data[fontOffset + col];
        for (let row = 0; row < 8; row++) {
          if ((line >> row) & 1) {
            ctx.fillRect(charX + col * scale, Math.round(y + row * scale), scale, scale);
          }
        }
      }
    }
  }

  return totalWidth;
}
