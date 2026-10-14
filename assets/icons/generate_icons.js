/**
 * ShieldLens — Icon Generator
 * Generates PNG icon files (16x16, 32x32, 48x48, 128x128) using pure Node.js zlib/png encoding.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function generatePNG(width, height) {
  // Simple solid blue/emerald shield PNG generator
  const bufferSize = (width * 4 + 1) * height;
  const rawData = Buffer.alloc(bufferSize);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      // Draw shield shape outline/fill (Emerald #10b981 / Slate #0f172a)
      const cx = width / 2;
      const cy = height / 2;
      const dx = (x - cx) / (width / 2);
      const dy = (y - cy) / (height / 2);
      const inShield = (Math.abs(dx) <= 0.8 && dy >= -0.8 && dy <= 0.8 - Math.abs(dx) * 0.4);

      if (inShield) {
        rawData[offset++] = 0x10; // R (#10b981)
        rawData[offset++] = 0xb9; // G
        rawData[offset++] = 0x81; // B
        rawData[offset++] = 0xff; // A
      } else {
        rawData[offset++] = 0x0f; // R (#0f172a)
        rawData[offset++] = 0x17; // G
        rawData[offset++] = 0x2a; // B
        rawData[offset++] = 0xff; // A
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);

  const checksumData = Buffer.concat([typeBuf, data]);
  const crc = crc32(checksumData);
  crcBuf.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

// Pre-computed CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname);

sizes.forEach(size => {
  const pngBuf = generatePNG(size, size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuf);
  console.log(`Generated icon${size}.png`);
});
