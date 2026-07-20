export interface Swatch {
  index: number;
  hex: string;
  name: string;
  type: 'base' | 'shadow' | 'highlight' | 'accent' | 'outline' | 'detail' | 'blush' | 'eye';
}

export interface Palette {
  name: string;
  swatches: Swatch[];
  outline: number;
  base: number;
  shadow: number;
  highlight: number;
  accent: number;
  detail?: number;
  blush?: number;
  eye?: number;
}

export type AnimalType = 'cat' | 'bunny' | 'fox' | 'panda' | 'bear';
export type BodyStyle = 'cute' | 'detailed' | 'chubby' | 'slender';
export type PoseType =
  | 'idle'
  | 'happy'
  | 'hugging'
  | 'holding'
  | 'jumping'
  | 'sleeping'
  | 'sitting_side'
  | 'waving'
  | 'eating'
  | 'cute_pose';

export type ArmPosition = 'none' | 'front' | 'side' | 'up' | 'holding' | 'waving';

export type EyeType =
  | 'round'
  | 'cute'
  | 'happy'
  | 'wink'
  | 'sleepy'
  | 'anime'
  | 'sparkle'
  | 'shy'
  | 'angry'
  | 'surprised';

export type MouthType =
  | 'small'
  | 'smile'
  | 'open'
  | 'w'
  | 'tongue'
  | 'fang'
  | 'beak'
  | 'cat_mouth'
  | 'duck';

export type EarType = 'rounded' | 'pointed' | 'floppy' | 'long' | 'tufted' | 'small';
export type TailType = 'none' | 'short' | 'long' | 'fluffy' | 'curled' | 'waving' | 'heart';

export interface BodyConfig {
  style: BodyStyle;
  headRatio: number; // 0.45 - 0.65
  bodyRatio: number; // 0.35 - 0.55
  shoulderWidth: number; // 0-2 extra width
  torsoHeight: number; // 0-4 extra height
  armPosition: ArmPosition;
  legPosition: 'sitting' | 'standing' | 'wide' | 'tucked';
  pose: PoseType;
}

export interface FaceConfig {
  eye: EyeType;
  mouth: MouthType;
  blush: boolean;
  markings?: 'none' | 'stripe' | 'mask' | 'freckles';
}

export interface StyleConfig {
  style: 'kawaii' | 'premium' | 'chibi';
  lineWeight: 'thin' | 'medium' | 'thick';
  shading: 'flat' | 'soft' | 'bold';
  beadGloss: boolean;
}

export interface CharacterConfig {
  gridSize: number;
  animal: AnimalType;
  palette: string;
  body: BodyConfig;
  face: FaceConfig;
  style: StyleConfig;
  ear: EarType;
  tail: TailType;
  accessory: 'none' | 'bow' | 'heart' | 'flower' | 'bamboo' | 'ball' | 'scarf' | 'hat' | 'cape';
  outfit?: 'none' | 'bandana' | 'sweater' | 'cape' | 'apron' | 'wizard' | 'astronaut';
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
  style: string;
}
