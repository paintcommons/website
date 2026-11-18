import type { SwatchPaint } from './swatch.js';
export interface WallPaint extends SwatchPaint { name: string; brand?: string | null; id?: string | number | null }
export const RAMP_LABELS: [string, string][];
export const RAMPS: unknown;
export const SAME_COLOUR_DISTANCE: number;
export function colourMeta(paint: WallPaint): { family: string; lightness: number };
export function colourCompare(a: WallPaint, b: WallPaint): number;
export function finishKey(paint: WallPaint): string;
export interface Fold<T> { item: T; items: T[]; family: string; finish: string }
export function foldLikeColours<T>(items: T[], options?: { enabled?: boolean; paintOf?: (item: T) => WallPaint; rank?: (item: T) => number }): Fold<T>[];
export function combineLikeColours<T extends WallPaint>(paints: T[], enabled?: boolean): { paint: T; paints: T[]; family: string; finish: string }[];
export function sectionsOf<T extends WallPaint>(paints: T[], group?: 'type' | 'brand' | 'range' | 'none'): { key: string; label: string; paints: T[] }[];
export function packColumns<T>(items: T[], cols: number, options?: { paintOf?: (item: T) => WallPaint; coloured?: boolean; fits?: (bands: T[][][], fold: number) => boolean }): { bands: T[][][]; fold: number } | null;
