import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { checkWebSerialSupport } from "../lib/installer/browser-support";

describe("Web Installer: Firmware Manifest & Binary Artifacts", () => {
  const publicFirmwareDir = path.resolve(__dirname, "../public/firmware");
  const manifestPath = path.join(publicFirmwareDir, "manifest.json");

  it("manifest.json exists and conforms to ESP Web Tools specification", () => {
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.name).toBe("SANTA-OS for M5StickC-Plus");
    expect(typeof manifest.version).toBe("string");
    expect(manifest.new_install_improv_wait_time).toBe(10);
    expect(manifest.builds).toBeDefined();
    expect(manifest.builds.length).toBeGreaterThan(0);

    const build = manifest.builds[0];
    expect(build.chipFamily).toBe("ESP32");
    expect(Array.isArray(build.parts)).toBe(true);
    expect(build.parts.length).toBe(4);
  });

  it("all 4 required partition binaries exist with correct flash offsets", () => {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    const parts = manifest.builds[0].parts;

    const expectedParts = [
      { path: "bootloader.bin", offset: 4096, minSizeKb: 15 },
      { path: "partitions.bin", offset: 32768, minSizeKb: 2 },
      { path: "boot_app0.bin", offset: 57344, minSizeKb: 4 },
      { path: "firmware.bin", offset: 65536, minSizeKb: 500 },
    ];

    for (const exp of expectedParts) {
      const part = parts.find((p: { path: string }) => p.path === exp.path);
      expect(part).toBeDefined();
      expect(part.offset).toBe(exp.offset);

      const binFile = path.join(publicFirmwareDir, exp.path);
      expect(fs.existsSync(binFile)).toBe(true);

      const stats = fs.statSync(binFile);
      expect(stats.size).toBeGreaterThan(exp.minSizeKb * 1024);
    }
  });

  it("configures Improv Wi-Fi serial parameters in manifest", () => {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.new_install_improv_wait_time).toBeDefined();
    expect(manifest.new_install_improv_wait_time).toBe(10);
  });
});

describe("Web Installer: Browser Support Detection", () => {
  it("detects Web Serial support when navigator.serial is present", () => {
    const chromeUA =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
    const result = checkWebSerialSupport(chromeUA, true);
    expect(result.isSupported).toBe(true);
    expect(result.browserName).toBe("Google Chrome");
    expect(result.recommendation).toContain("w pełni obsługuje");
  });

  it("identifies unsupported Safari browser on macOS", () => {
    const safariUA =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15";

    const result = checkWebSerialSupport(safariUA);
    expect(result.isSupported).toBe(false);
    expect(result.browserName).toBe("Apple Safari");
    expect(result.recommendation).toContain("Apple Safari nie obsługuje standardu Web Serial");
  });

  it("identifies unsupported Mozilla Firefox", () => {
    const firefoxUA =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0";

    const result = checkWebSerialSupport(firefoxUA);
    expect(result.isSupported).toBe(false);
    expect(result.browserName).toBe("Mozilla Firefox");
    expect(result.recommendation).toContain("Firefox");
  });

  it("identifies mobile iOS and warns against mobile browser usage", () => {
    const iphoneUA =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";

    const result = checkWebSerialSupport(iphoneUA);
    expect(result.isSupported).toBe(false);
    expect(result.isDesktop).toBe(false);
    expect(result.recommendation).toContain("iOS");
  });

  it("identifies Microsoft Edge browser", () => {
    const edgeUA =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";

    const result = checkWebSerialSupport(edgeUA);
    expect(result.browserName).toBe("Microsoft Edge");
  });

  it("identifies Opera browser when both Chrome and OPR tokens are present", () => {
    const operaUA =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0";

    const result = checkWebSerialSupport(operaUA, true);
    expect(result.isSupported).toBe(true);
    expect(result.browserName).toBe("Opera");
  });

  it("identifies modern iPadOS masking as desktop Safari with touch points", () => {
    const ipadDesktopUA =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15";

    // maxTouchPoints = 5 indicates an iPad touch screen despite "Macintosh" UA token
    const result = checkWebSerialSupport(ipadDesktopUA, false, 5);
    expect(result.isSupported).toBe(false);
    expect(result.isDesktop).toBe(false);
    expect(result.browserName).toBe("Apple iPadOS (Safari)");
    expect(result.recommendation).toContain("iOS/iPadOS");
  });
});
