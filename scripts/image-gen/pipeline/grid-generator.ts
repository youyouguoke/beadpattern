import type { PatternDSL, ShapeLayer, ShapeContext } from './types.js';
import { registry, createMask, drawCircle, createShapeLayer } from './shapes/base.js';
import { pandaShape } from './shapes/panda.js';
import {
  catShape, flowerShape, heartShape, starShape, ghostShape, pumpkinShape, rainbowShape, smileyShape, mushroomShape, bunnyShape,
} from './shapes/subjects.js';

// Register subject shapes
registry.register({ name: 'panda', tags: ['panda', 'bear', 'animal'], render: pandaShape });
registry.register({ name: 'cat', tags: ['cat', 'kitten', 'animal'], render: catShape });
registry.register({ name: 'flower', tags: ['flower', 'floral', 'plant'], render: flowerShape });
registry.register({ name: 'heart', tags: ['heart', 'love', 'valentine'], render: heartShape });
registry.register({ name: 'star', tags: ['star', 'sky'], render: starShape });
registry.register({ name: 'ghost', tags: ['ghost', 'halloween'], render: ghostShape });
registry.register({ name: 'pumpkin', tags: ['pumpkin', 'halloween'], render: pumpkinShape });
registry.register({ name: 'rainbow', tags: ['rainbow'], render: rainbowShape });
registry.register({ name: 'smiley', tags: ['smiley', 'face'], render: smileyShape });
registry.register({ name: 'mushroom', tags: ['mushroom'], render: mushroomShape });
registry.register({ name: 'bunny', tags: ['bunny', 'rabbit', 'animal'], render: bunnyShape });

export interface GridGeneratorInput {
  dsl: PatternDSL;
  palette: string[];
}

export interface GridGeneratorOutput {
  grid: string[][];
  layers: ShapeLayer[];
}

function composeLayers(layers: ShapeLayer[], size: number, background: string): string[][] {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(background));
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  for (const layer of sorted) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (layer.mask[y][x]) grid[y][x] = layer.color;
      }
    }
  }
  return grid;
}

export class DslGridGenerator {
  generate(input: GridGeneratorInput): GridGeneratorOutput {
    const { dsl, palette } = input;
    const size = dsl.gridSize;
    const background = dsl.background;
    const ctx: ShapeContext = { size, dsl, palette, background };

    const shape = registry.find(dsl.subject, dsl.features)[0];
    let layers: ShapeLayer[];
    if (shape) {
      layers = shape.render(ctx);
    } else {
      const mask = drawCircle(createMask(size), size / 2, size / 2, size * 0.4);
      layers = [createShapeLayer(ctx, mask, 'body', 0, 'fallback-circle')];
    }

    const grid = composeLayers(layers, size, background);
    return { grid, layers };
  }
}

export function dslToPalette(dsl: PatternDSL): string[] {
  const base: Record<string, string[]> = {
    panda: ['#ffffff', '#12171a', '#ffb6c1'],
    cat: ['#ffb6c1', '#12171a', '#ffffff'],
    flower: ['#ff69b4', '#ffff00', '#ffffff'],
    heart: ['#ff0000', '#ffffff'],
    star: ['#ffff00', '#ffffff'],
    ghost: ['#ffffff', '#12171a', '#ff0000'],
    pumpkin: ['#ff7f00', '#006400', '#12171a'],
    rainbow: ['#ff0000', '#ff7f00', '#ffff00', '#00aa00', '#0066ff', '#800080'],
    smiley: ['#ffff00', '#12171a', '#ff0000'],
    mushroom: ['#ff0000', '#ffffff', '#8b4513'],
    bunny: ['#ffffff', '#ffb6c1', '#12171a'],
    default: ['#7b7c7c', '#ffffff', '#12171a'],
  };
  const colors = base[dsl.subject.toLowerCase()] || base.default;
  return colors.slice(0, dsl.maxColors);
}
