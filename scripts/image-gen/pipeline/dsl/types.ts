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

export interface ShapeDefinition {
  name: string;
  tags: string[];
  render: ShapeRenderer;
}

export interface ShapeLibrary {
  shapes: ShapeDefinition[];
  find(subject: string, features: string[]): ShapeDefinition[];
}
