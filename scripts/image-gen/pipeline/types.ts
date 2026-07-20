export interface VisualSpec {
  category: string;
  composition: 'center' | 'left' | 'right';
  symmetry: 'vertical' | 'horizontal' | 'none';
  outline: 'strong' | 'medium' | 'soft';
  style: 'cute' | 'flat' | 'realistic';
  maxColors: number;
  background: string;
  gridSize: number;
  margin: number;
  padding: number;
  eyeStyle?: 'round' | 'dot' | 'none';
  highlight?: boolean;
}

export type Composition = 'center' | 'left' | 'right';
export type Symmetry = 'vertical' | 'horizontal' | 'none';
export type Outline = 'strong' | 'medium' | 'soft';
export type Style = 'cute' | 'flat' | 'realistic';
export type LayerType = 'body' | 'detail' | 'outline' | 'highlight';

export interface PatternDSL {
  subject: string;
  features: string[];
  style: Style;
  symmetry: Symmetry;
  composition: Composition;
  outline: Outline;
  maxColors: number;
  background: string;
  gridSize: number;
  margin: number;
}

export interface ShapeLayer {
  id: string;
  type: LayerType;
  color: string;
  mask: boolean[][];
  zIndex: number;
}

export interface ShapeContext {
  size: number;
  dsl: PatternDSL;
  palette: string[];
  background: string;
}

export type ShapeRenderer = (ctx: ShapeContext) => ShapeLayer[];

export interface QualityScore {
  shape: number;
  craftability: number;
  color: number;
  symmetry: number;
  detail: number;
  total: number;
  reasons: string[];
}

export interface PatternConfig {
  slug: string;
  subject: string;
  spec: VisualSpec;
  palette: { name: string; hex: string; role?: string }[];
  dsl?: PatternDSL;
}

export interface GridOutput {
  grid: string[][];
  palette: { name: string; hex: string }[];
  score: number;
  rejected: boolean;
  reasons: string[];
  quality?: QualityScore;
  layers?: ShapeLayer[];
}

export interface RenderOutput {
  cover: Buffer;
  finished: Buffer;
  thumbnail: Buffer;
}

export interface AssetOutput {
  cover: Buffer;
  preview: Buffer;
  thumbnail: Buffer;
  printable: Buffer;
  pdf: Uint8Array;
  metadata: PatternMetadata;
}

export interface PatternMetadata {
  gridSize: string;
  beadCount: number;
  colorCount: number;
  colors: { hex: string; name: string; count: number }[];
  qualityScore: QualityScore;
  generatedAt: string;
  dsl?: PatternDSL;
}
