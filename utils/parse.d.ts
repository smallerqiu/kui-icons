export interface SVGPathItem {
    d: string;
    styles: Record<string, string>;
    type: string;
}
export interface SVGGroupedItem {
    d: string;
    styles: Record<string, string>;
}
export interface SVGAttributes {
    xmlns: string;
    viewBox: string;
    vx: number;
    vy: number;
    vw: number;
    vh: number;
}
export declare const formatStyleAttribute: (styles: Record<string, string>) => string;
export declare const getGroupedPathArray: (svgContent: string, size?: number) => SVGGroupedItem[];
