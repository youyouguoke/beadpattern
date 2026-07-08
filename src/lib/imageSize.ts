function bufferToString(data: Uint8Array, offset: number, len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += String.fromCharCode(data[offset + i]);
  }
  return s;
}

export function parsePngSize(buffer: ArrayBuffer): { width: number; height: number } | null {
  const data = new Uint8Array(buffer);
  if (bufferToString(data, 0, 8) !== '\x89PNG\r\n\x1a\n') return null;
  const width = readUint32BE(data, 16);
  const height = readUint32BE(data, 20);
  return { width, height };
}

export function parseJpegSize(buffer: ArrayBuffer): { width: number; height: number } | null {
  const data = new Uint8Array(buffer);
  let offset = 2;
  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = data[offset + 1];
    if (marker === 0xd9 || marker === 0xd8 || marker === 0x00) {
      offset += 2;
      continue;
    }
    const len = readUint16(data, offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = readUint16(data, offset + 5);
      const width = readUint16(data, offset + 7);
      return { width, height };
    }
    offset += 2 + len;
  }
  return null;
}

export function parseGifSize(buffer: ArrayBuffer): { width: number; height: number } | null {
  const data = new Uint8Array(buffer);
  const sig = bufferToString(data, 0, 6);
  if (sig !== 'GIF87a' && sig !== 'GIF89a') return null;
  const width = data[6] | (data[7] << 8);
  const height = data[8] | (data[9] << 8);
  return { width, height };
}

export function parseWebpSize(buffer: ArrayBuffer): { width: number; height: number } | null {
  const data = new Uint8Array(buffer);
  if (bufferToString(data, 0, 4) !== 'RIFF' || bufferToString(data, 8, 4) !== 'WEBP') return null;
  const type = bufferToString(data, 12, 4);
  if (type === 'VP8 ') {
    if (data[20] === 0x9d && data[21] === 0x01 && data[22] === 0x2a) {
      const width = readUint16(data, 26) & 0x3fff;
      const height = readUint16(data, 28) & 0x3fff;
      return { width, height };
    }
  } else if (type === 'VP8L') {
    if (data[20] === 0x2f) {
      const b0 = data[21];
      const b1 = data[22];
      const b2 = data[23];
      const b3 = data[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { width, height };
    }
  } else if (type === 'VP8X') {
    const width = 1 + readUint24(data, 28);
    const height = 1 + readUint24(data, 31);
    return { width, height };
  }
  return null;
}

export function parseImageSize(buffer: ArrayBuffer, contentType: string): { width: number; height: number } | null {
  switch (contentType) {
    case 'image/png':
      return parsePngSize(buffer);
    case 'image/jpeg':
      return parseJpegSize(buffer);
    case 'image/gif':
      return parseGifSize(buffer);
    case 'image/webp':
      return parseWebpSize(buffer);
    default:
      return null;
  }
}

function readUint32BE(data: Uint8Array, offset: number): number {
  return (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
}

function readUint16(data: Uint8Array, offset: number): number {
  return (data[offset] << 8) | data[offset + 1];
}

function readUint24(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16);
}
