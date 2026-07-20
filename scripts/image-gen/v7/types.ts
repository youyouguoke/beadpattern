// v7 Pixel Character Composer
// Pipeline: Animal DNA → Skeleton → Silhouette → Pixel Simplifier → Color → Render
export type AnimalType = 'cat';

export type PoseType =
  | 'sitting'
  | 'loaf'
  | 'sleeping'
  | 'stretching'
  | 'playing-yarn'
  | 'washing-face'
  | 'waving'
  | 'jumping'
  | 'curled'
  | 'eating';

export type EyeType = 'cute' | 'happy' | 'sleepy' | 'curious' | 'wink';
export type EyeDirection = 'front' | 'left' | 'right' | 'up' | 'down';
export type EarAngle = 'alert' | 'relaxed' | 'curious' | 'flat';
export type MouthType = 'w' | 'small' | 'open' | 'tongue' | 'cat';

export interface Swatch {
  index: number;
  hex: string;
  name: string;
  type: 'outline' | 'base' | 'shadow' | 'highlight' | 'belly' | 'nose' | 'ear' | 'eye' | 'blush';
}

export interface Palette {
  name: string;
  swatches: Swatch[];
  outline: number;
  base: number;
  shadow: number;
  highlight: number;
  belly: number;
  nose: number;
  ear: number;
  eye: number;
  blush?: number;
}

export interface SkeletonAnchor {
  head: { x: number; y: number; rx: number; ry: number };
  neck: { x: number; y: number };
  spine: { x1: number; y1: number; x2: number; y2: number };
  chest: { x: number; y: number; rx: number; ry: number };
  hip: { x: number; y: number; rx: number; ry: number };
  frontLegs: { x: number; y: number; len: number }[];
  hindLegs: { x: number; y: number; len: number; angle: 'out' | 'back' | 'tucked' }[];
  tail: { baseX: number; baseY: number; shape: 'up' | 'around' | 'wrap' | 'straight' };
  ear: { angle: EarAngle; height: number };
  headTilt: number;
}

export interface CharacterConfig {
  gridSize: number;
  animal: AnimalType;
  pose: PoseType;
  face: {
    eye: EyeType;
    eyeDirection: EyeDirection;
    mouth: MouthType;
    blush: boolean;
  };
  accessory: 'none' | 'bow' | 'flower' | 'scarf';
}

export interface ComposerResult {
  grid: number[][];
  palette: Palette;
  colorMap: number[];
}

export interface PatternMetadata {
  slug: string;
  title: string;
  colors: number;
  animal: AnimalType;
  pose: PoseType;
}

export type ComposerMode = 'silhouette' | 'full';
