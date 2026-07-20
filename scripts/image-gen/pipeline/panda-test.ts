import type { PatternConfig } from './types.js';

export function generatePandaGrid(): string[][] {
  const size = 29;
  const bg = '#ffffff';
  const white = '#f5f5f5';
  const lightGray = '#d0d0d0';
  const black = '#1a1a1a';
  const pink = '#f48fb1';
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(bg));

  const cx = 14;
  const cy = 14;

  // 1. 白色大脸：几乎占满画面
  const faceR = 14;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= faceR * faceR) {
        grid[y][x] = white;
      }
    }
  }

  // 2. 黑色耳朵：更靠内，更饱满
  const earR = 5;
  const ears = [{ x: 5, y: 6 }, { x: 23, y: 6 }];
  for (const ear of ears) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - ear.x;
        const dy = y - ear.y;
        if (dx * dx + dy * dy <= earR * earR) {
          grid[y][x] = black;
        }
      }
    }
  }

  // 3. 眼罩：黑色椭圆，内移
  const patches = [{ x: 9, y: 14 }, { x: 19, y: 14 }];
  for (const p of patches) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - p.x;
        const dy = y - p.y;
        if (dx * dx / (4.5 * 4.5) + dy * dy / (4 * 4) <= 1) {
          grid[y][x] = black;
        }
      }
    }
  }

  // 4. 眼睛：白色底 + 黑色瞳孔
  const eyes = [{ x: 8, y: 14 }, { x: 20, y: 14 }];
  for (const eye of eyes) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - eye.x;
        const dy = y - eye.y;
        if (dx * dx + dy * dy <= 2.5 * 2.5) {
          grid[y][x] = white;
        }
        if (dx * dx + dy * dy <= 1.2 * 1.2) {
          grid[y][x] = black;
        }
      }
    }
  }

  // 5. 鼻子：黑色小椭圆
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - 20;
      if (dx * dx / (2.5 * 2.5) + dy * dy / (1.5 * 1.5) <= 1) {
        grid[y][x] = black;
      }
    }
  }

  // 6. 嘴巴：倒Y形
  grid[22][14] = black;
  grid[23][13] = black;
  grid[23][15] = black;
  grid[24][12] = black;
  grid[24][16] = black;

  // 7. 腮红：粉色
  const cheeks = [{ x: 6, y: 19 }, { x: 22, y: 19 }];
  for (const cheek of cheeks) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cheek.x;
        const dy = y - cheek.y;
        if (dx * dx + dy * dy <= 2.2 * 2.2) {
          grid[y][x] = pink;
        }
      }
    }
  }

  // 8. 灰色阴影层次：让脸更立体
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      // 脸边缘一圈浅灰
      if (d >= 11 && d <= 13 && grid[y][x] === white) {
        grid[y][x] = lightGray;
      }
    }
  }

  return grid;
}

export function generatePandaConfig(): PatternConfig {
  return {
    slug: 'panda-test',
    subject: 'cute panda face',
    spec: {
      category: 'animal',
      gridSize: 29,
      margin: 0,
      padding: 0,
      symmetry: 'vertical',
      composition: 'center',
      outline: 'strong',
      style: 'cute',
      maxColors: 5,
      background: '#ffffff',
    },
    palette: [
      { name: 'Black', hex: '#1a1a1a' },
      { name: 'Light Gray', hex: '#d0d0d0' },
      { name: 'White', hex: '#f5f5f5' },
      { name: 'Pink', hex: '#f48fb1' },
      { name: 'Background', hex: '#ffffff' },
    ],
  };
}
