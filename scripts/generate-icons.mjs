import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createSimplePNG(width, height, r, g, b, isMaskable = false) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(2, 9); // Truecolor (RGB)
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  const maxRadius = isMaskable ? width * 0.35 : width * 0.42;
  const badgeRadius = isMaskable ? width * 0.28 : width * 0.34;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < maxRadius) {
        // Inner badge: bright emerald / gold / white
        if (dist < badgeRadius) {
          // Center core
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
        } else {
          // Ring accent: Gold (245, 158, 11)
          rawData[pxOffset] = 245;
          rawData[pxOffset + 1] = 158;
          rawData[pxOffset + 2] = 11;
        }
      } else {
        // Emerald background: R: 5, G: 150, B: 105 (#059669)
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(4 + 4 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeUInt32BE(crc >>> 0, 8 + length);
  return buffer;
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

const iconsDir = path.join(process.cwd(), 'public', 'icons');
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Brand Emerald: #059669 (5, 150, 105)
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), createSimplePNG(192, 192, 5, 150, 105, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), createSimplePNG(512, 512, 5, 150, 105, false));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192x192.png'), createSimplePNG(192, 192, 5, 150, 105, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512x512.png'), createSimplePNG(512, 512, 5, 150, 105, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createSimplePNG(180, 180, 5, 150, 105, false));
fs.writeFileSync(path.join(publicDir, 'favicon.png'), createSimplePNG(32, 32, 5, 150, 105, false));

console.log('Successfully generated all KPF icons in public/icons and public!');
