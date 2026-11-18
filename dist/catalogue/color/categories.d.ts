export type Category = 'acrylic' | 'speedpaint' | 'airbrush' | 'airbrush-metallic' | 'metallic' | 'wash' | 'effect';
export interface PaintLike { type?: string | null; range?: string | null; name?: string }
export const GROUPING_VERSION: string;
export const CATEGORIES: [Category, string][];
export function isAirbrushPaint(paint: PaintLike): boolean;
export function isMetallicPaint(paint: PaintLike): boolean;
export function isSpeedpaintPaint(paint: PaintLike): boolean;
export function categoryOf(paint: PaintLike): Category;
export function categoryLabel(category: Category, spelling?: 'us' | 'uk'): string;
