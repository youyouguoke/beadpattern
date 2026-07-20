export interface Swatch {
  index: number;
  hex: string;
  name: string;
  type: 'outline' | 'base' | 'shadow' | 'highlight' | 'belly' | 'nose' | 'ear' | 'eye' | 'blush' | 'tail' | 'paw';
}

export interface Palette {
  name: string;
  swatches: Swatch[];
  // Semantic roles (indexes into swatches, not directly color indices)
  outline: number;
  base: number;
  shadow: number;
  highlight: number;
  belly: number;
  nose: number;
  ear: number;
  eye: number;
  blush?: number;
  tail?: number;
  paw?: number;
}

export type AnimalType = 'cat' | 'fox' | 'bunny' | 'panda' | 'bear';

export type PoseType = 'sitting' | 'standing' | 'sleeping' | 'curious' | 'playful';

export type EyeType = 'round' | 'cute' | 'happy' | 'sleepy' | 'curious' | 'angry';

export type MouthType = 'small' | 'smile' | 'open' | 'w' | 'tongue' | 'cat';

export interface BodyConfig {
  pose: PoseType;
  headTilt: number; // -3..3 pixels
  shoulderWidth: number; // 0..4
  torsoLength: number; // 0..6
  armLength: number; // 0..8
  legLength: number; // 0..6
}

export interface FaceConfig {
  eye: EyeType;
  mouth: MouthType;
  blush: boolean;
  expression: 'neutral' | 'happy' | 'sleepy' | 'curious' | 'grumpy';
}

export interface CharacterConfig {
  gridSize: number; // 48
  animal: AnimalType;
  palette: string;
  body: BodyConfig;
  face: FaceConfig;
  ear: 'pointed' | 'rounded' | 'tufted' | 'long' | 'floppy';
  tail: 'short' | 'long' | 'fluffy' | 'curled';
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
  palette: string;
  animal: AnimalType;
  pose: PoseType;
}

// v5 Design Rule: each species has a fixed color grammar.
// Color roles are assigned to body parts, not rendered by a global light engine.
