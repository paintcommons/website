import type { PaintLike } from './categories.js';
/** A Paint Commons record or a Stipplewise catalog row. */
export interface SwatchPaint extends PaintLike {
  colour?: { hex?: string | null; gradient?: (string | null)[] | null } | null;
  hex?: string | null;
  hex_gradient?: string | null;
}
export type SwatchKind = 'none' | 'flat' | 'metal' | 'speed' | 'smooth';
export const METAL_LIGHT_END: number;
export function mix(a: string, b: string, t: number): string;
export function hexOf(paint: SwatchPaint): string | null;
export function gradientStops(paint: SwatchPaint): (string | null)[];
export function sourceGradient(paint: SwatchPaint): string | null;
export function isWashOrGlaze(paint: PaintLike): boolean;
export function swatchKind(paint: SwatchPaint): SwatchKind;
export function swatchStops(paint: SwatchPaint): string[];
export function swatchBackground(paint: SwatchPaint): string | null;
export function paintSwatch(ctx: CanvasRenderingContext2D, paint: SwatchPaint, x: number, y: number, w: number, h: number): void;
