// Pixel Character Composer v3.0
// Core types and design system

export type AnimalType = 'cat' | 'dog' | 'panda' | 'fox' | 'penguin' | 'bear' | 'lion' | 'bunny' | 'frog';

export type BodyPose = 'face-only' | 'sitting' | 'standing' | 'sleeping' | 'playing' | 'holding' | 'jumping';

export type TailStyle = 'none' | 'left' | 'right' | 'curl' | 'straight' | 'heart' | 'fluffy';

export type EyeStyle = 'round' | 'sleepy' | 'anime' | 'cute' | 'happy' | 'wink';

export type EarStyle = 'pointed' | 'rounded' | 'floppy' | 'large' | 'small' | 'tufted';

export type Accessory = 'none' | 'bamboo' | 'bow' | 'heart' | 'ball' | 'flower' | 'scarf';

export interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
  usage: 'base' | 'shadow' | 'highlight' | 'accent' | 'outline';
}

export interface Palette {
  name: string;
  swatches: ColorSwatch[];
  // default index for each usage role
  outline: number;
  base: number;
  shadow: number;
  highlight: number;
  accent: number;
}

export interface CharacterConfig {
  animal: AnimalType;
  title: string;
  slug: string;
  // anatomy
  pose: BodyPose;
  bodyWidth?: number;  // in grid cells
  bodyHeight?: number; // in grid cells
  headSize?: 'small' | 'medium' | 'large';
  ear: EarStyle;
  eye: EyeStyle;
  tail: TailStyle;
  accessory: Accessory;
  // palette
  palette: Palette;
  // grid
  gridSize: number;
}

export interface ComposerResult {
  grid: number[][];
  palette: Palette;
  colorMap: number[]; // 1-based color indices used in grid
}
