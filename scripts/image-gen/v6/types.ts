export interface Swatch {
  index: number;
  hex: string;
  name: string;
  type: 'outline' | 'base' | 'shadow' | 'highlight' | 'belly' | 'nose' | 'ear' | 'eye' | 'blush' | 'tail' | 'paw';
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
  tail?: number;
  paw?: number;
}

export type AnimalType = 'cat' | 'fox' | 'bunny' | 'panda' | 'bear';

export type PoseType = 'sitting' | 'standing' | 'sleeping' | 'stretching' | 'playful' | 'waving' | 'holding' | 'eating' | 'curled' | 'jumping' | 'happy' | 'running';

export type EyeType = 'round' | 'cute' | 'happy' | 'sleepy' | 'curious' | 'angry';
export type EyeDirection = 'front' | 'left' | 'right' | 'up' | 'down';

export type EarAngle = 'alert' | 'relaxed' | 'curious';

export type MouthType = 'small' | 'smile' | 'open' | 'w' | 'tongue' | 'cat';

export interface FaceConfig {
  eye: EyeType;
  eyeDirection: EyeDirection;
  mouth: MouthType;
  blush: boolean;
  expression: 'neutral' | 'happy' | 'sleepy' | 'curious' | 'grumpy';
}

export interface BodyConfig {
  pose: PoseType;
  headTilt: number;
  earAngle: EarAngle;
}

export interface CharacterConfig {
  gridSize: number;
  animal: AnimalType;
  palette: string;
  body: BodyConfig;
  face: FaceConfig;
  accessory: 'none' | 'bow' | 'flower' | 'scarf' | 'heart';
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
