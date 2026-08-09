// generates placeholder PNGs (team avatars + OG cards). no image tooling
// needed: raw RGBA + zlib. text impossible here, so OG cards get the brand
// grid + accent block instead of words.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

function png(width, height, draw) {
  const buf = Buffer.alloc(width * height * 4);
  draw((x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
  });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // bit depth 8, color type RGBA
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    for (let x = 0; x < width; x++) {
      buf.copy(row, 1 + x * 4, (y * width + x) * 4, (y * width + x + 1) * 4);
    }
    rows.push(row);
  }
  const idat = deflateSync(Buffer.concat(rows));
  function chunk(type, data) {
    const c = Buffer.alloc(12 + data.length);
    c.writeUInt32BE(data.length, 0);
    c.write(type, 4);
    data.copy(c, 8);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    c.writeUInt32BE(crc >>> 0, 8 + data.length);
    return c;
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const VOID = [5, 5, 7];
const SURFACE = [13, 13, 18];
const ACCENT = [255, 49, 68];

function avatar(name) {
  const size = 192;
  const hue = name.includes("saniya") ? 8 : 0; // shade per person
  const accent = ACCENT.map((v, i) => Math.min(255, v + (i === 1 ? -8 : 0)));
  return png(size, size, (set) => {
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        set(x, y, SURFACE[0], SURFACE[1], SURFACE[2]);
      }
    // border frame
    for (let i = 0; i < 3; i++) {
      for (let x = i; x < size - i; x++) {
        set(x, i, accent[0], accent[1], accent[2]);
        set(x, size - 1 - i, accent[0], accent[1], accent[2]);
      }
      for (let y = i; y < size - i; y++) {
        set(i, y, accent[0], accent[1], accent[2]);
        set(size - 1 - i, y, accent[0], accent[1], accent[2]);
      }
    }
    // initials block: two stacked squares (A / S stand-in glyph)
    const cx = size / 2;
    const y0 = size / 2 - 24, y1 = size / 2 + 8;
    for (let y = y0; y < y0 + 26; y++)
      for (let x = cx - 20; x < cx + 20; x++)
        if (Math.abs(x - cx) > 8 || y > y0 + 8) set(x, y, accent[0], accent[1], accent[2], hue ? 160 : 200);
    for (let y = y1; y < y1 + 18; y++)
      for (let x = cx - 20; x < cx + 20; x++)
        if (Math.abs(x - cx) > 8 || y > y1 + 8) set(x, y, accent[0], accent[1], accent[2], hue ? 160 : 200);
  });
}

function ogCard() {
  const W = 1200, H = 630;
  return png(W, H, (set) => {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        set(x, y, VOID[0], VOID[1], VOID[2]);
        const onGrid = x % 60 < 1 || y % 60 < 1;
        if (onGrid) set(x, y, 30, 30, 46); // --border tone
      }
    // accent block, corner
    for (let y = 60; y < 240; y++)
      for (let x = 60; x < 220; x++) {
        const edge = x < 63 || x > 216 || y < 63 || y > 236;
        set(x, y, ACCENT[0], ACCENT[1], ACCENT[2], edge ? 255 : 90);
      }
    // big slab bottom-right
    for (let y = 380; y < 580; y++)
      for (let x = 900; x < 1150; x++) {
        const edge = x < 903 || x > 1146 || y < 383 || y > 576;
        set(x, y, ACCENT[0], ACCENT[1], ACCENT[2], edge ? 255 : 26);
      }
    // scale bar
    for (let y = 290; y < 300; y++)
      for (let x = 100; x < 700; x++) {
        if ((x - 100) % 25 < 12) set(x, y, 200, 200, 210, 200);
      }
  });
}

mkdirSync("public/placeholders", { recursive: true });
mkdirSync("public/og", { recursive: true });

writeFileSync("public/placeholders/team-aditya.png", avatar("aditya"));
writeFileSync("public/placeholders/team-saniya.png", avatar("saniya"));
for (const name of ["home", "docs", "privacy", "thank-you"]) {
  writeFileSync(`public/og/${name}.png`, ogCard());
}
console.log("placeholders written");