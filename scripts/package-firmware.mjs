import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const firmwareDir = path.join(rootDir, "firmware");
const pioBuildDir = path.join(firmwareDir, ".pio/build/m5stick-c");
const pagePkgPath = path.join(rootDir, "page/package.json");
const publicFirmwareDir = path.join(rootDir, "page/public/firmware");

console.log("🎅 SANTA-OS Firmware Packaging Pipeline");
console.log("========================================");

// 1. Read version from page/package.json
const pagePkg = JSON.parse(fs.readFileSync(pagePkgPath, "utf-8"));
const appVersion = pagePkg.version || "1.0.0";
console.log(`📦 Application Version: ${appVersion}`);

// 2. Ensure PlatformIO build artifacts exist, or compile them
const requiredPioBins = ["bootloader.bin", "partitions.bin", "firmware.bin"];
const hasPioBins = requiredPioBins.every((f) => fs.existsSync(path.join(pioBuildDir, f)));

const shouldRebuild = process.argv.includes("--rebuild") || !hasPioBins;

if (shouldRebuild) {
  console.log("⚙️  Compiling M5StickC-Plus firmware via PlatformIO (`pio run -e m5stick-c`)...");
  try {
    execSync("pio run -e m5stick-c", {
      cwd: firmwareDir,
      stdio: "inherit",
    });
  } catch (err) {
    console.error("❌ Firmware compilation failed:", err.message);
    process.exit(1);
  }
} else {
  console.log("✅ Using existing PlatformIO build artifacts in .pio/build/m5stick-c");
}

// 3. Locate boot_app0.bin
let bootApp0Path = path.join(firmwareDir, "boot_app0.bin");
if (!fs.existsSync(bootApp0Path)) {
  const pioSearchPath = path.join(
    process.env.HOME || "",
    ".platformio/packages/framework-arduinoespressif32/tools/partitions/boot_app0.bin"
  );
  if (fs.existsSync(pioSearchPath)) {
    bootApp0Path = pioSearchPath;
  } else {
    console.error("❌ Could not locate boot_app0.bin!");
    process.exit(1);
  }
}

// 4. Ensure target directory exists
if (!fs.existsSync(publicFirmwareDir)) {
  fs.mkdirSync(publicFirmwareDir, { recursive: true });
}

// 5. Define flash parts conforming to ESP Web Tools & huge_app partition layout
const flashParts = [
  {
    name: "bootloader.bin",
    src: path.join(pioBuildDir, "bootloader.bin"),
    offset: 4096, // 0x1000
    description: "ESP32 ROM Second-Stage Bootloader",
  },
  {
    name: "partitions.bin",
    src: path.join(pioBuildDir, "partitions.bin"),
    offset: 32768, // 0x8000
    description: "Partition Table (huge_app 3MB)",
  },
  {
    name: "boot_app0.bin",
    src: bootApp0Path,
    offset: 57344, // 0xe000
    description: "OTA Data Boot Selector",
  },
  {
    name: "firmware.bin",
    src: path.join(pioBuildDir, "firmware.bin"),
    offset: 65536, // 0x10000
    description: "Santa-OS Application Image",
  },
];

console.log("\n📋 Copying Flash Partitions:");
const manifestParts = [];

for (const part of flashParts) {
  if (!fs.existsSync(part.src)) {
    console.error(`❌ Missing source binary: ${part.src}`);
    process.exit(1);
  }

  const dest = path.join(publicFirmwareDir, part.name);
  fs.copyFileSync(part.src, dest);

  const stats = fs.statSync(dest);
  const buffer = fs.readFileSync(dest);
  const md5 = crypto.createHash("md5").update(buffer).digest("hex");

  console.log(
    `  • ${part.name.padEnd(16)} @ 0x${part.offset.toString(16).toUpperCase().padStart(5, "0")} | ` +
      `${(stats.size / 1024).toFixed(1).padStart(7)} KB | MD5: ${md5} | ${part.description}`
  );

  manifestParts.push({
    path: part.name,
    offset: part.offset,
  });
}

// 6. Generate manifest.json conforming to ESP Web Tools specification
const manifest = {
  name: "SANTA-OS for M5StickC-Plus",
  version: appVersion,
  home_page: "https://santa-tracker-five.vercel.app",
  new_install_prompt_erase: true,
  builds: [
    {
      chipFamily: "ESP32",
      parts: manifestParts,
    },
  ],
};

const manifestPath = path.join(publicFirmwareDir, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");

console.log(`\n📄 Generated Manifest: ${manifestPath}`);
console.log("🎉 Packaging complete! Firmware is ready for Web Serial flashing at /firmware/manifest.json\n");
