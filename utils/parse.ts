import { JSDOM } from "jsdom";
import { SVGPathData } from "svg-pathdata";

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

class SVGStyleExtractor {
  private size: number;
  public doc: Document;
  private cssRules: Record<string, Record<string, string>>;

  constructor(svgContent: string, size: number = 24) {
    this.size = size;
    const dom = new JSDOM(svgContent);
    this.doc = dom.window.document;
    this.cssRules = this.extractCSSRules();
  }

  extractCSSRules(): Record<string, Record<string, string>> {
    const rules: Record<string, Record<string, string>> = {};
    const styleSheets = this.doc.querySelectorAll("style");

    styleSheets.forEach((styleTag: Element) => {
      const cssText = styleTag.textContent || "";
      const matches = cssText.matchAll(/\.([^{]+)\s*\{([^}]+)\}/g);

      for (const match of matches) {
        if (match && match[1] && match[2]) {
          const className = match[1].trim();
          const styleBody = match[2];
          const styles = this.parseStyleAttribute(styleBody);
          rules[className] = styles;
        }
      }
    });

    return rules;
  }

  parseStyleAttribute(styleString: string): Record<string, string> {
    const styles: Record<string, string> = {};
    if (!styleString) return styles;

    styleString.split(";").forEach((rule) => {
      const [property, value] = rule.split(":");
      if (property && value) {
        const propName = property
          .trim()
          .replace(/-([a-z])/g, (_, p) => p.toUpperCase());
        styles[propName] = value.trim();
      }
    });

    return styles;
  }

  getElementStyles(element: Element): Record<string, string> {
    const finalStyles: Record<string, string> = {};

    const presentationAttrs = [
      "fill",
      "stroke",
      "stroke-width",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-miterlimit",
      "stroke-dasharray",
      "stroke-dashoffset",
      "fill-opacity",
      "stroke-opacity",
      "opacity",
    ];

    const stylesFromAttr: Record<string, string> = {};
    presentationAttrs.forEach((attr) => {
      const value = element.getAttribute(attr);
      if (value !== null && value !== undefined) {
        const camelCase = attr.replace(/-([a-z])/g, (_, g: string) =>
          g.toUpperCase(),
        );
        stylesFromAttr[camelCase] = value;
      }
    });

    Object.assign(finalStyles, stylesFromAttr);

    const classList = (element.getAttribute("class") || "")
      .split(/\s+/)
      .filter(Boolean);

    classList.forEach((cls: string) => {
      const classStyles = this.cssRules[cls];
      if (classStyles) {
        Object.assign(finalStyles, classStyles);
      }
    });

    const inlineStyle = element.getAttribute("style") || "";
    const inlineStyles = this.parseStyleAttribute(inlineStyle);
    Object.assign(finalStyles, inlineStyles);

    return finalStyles;
  }

  getAllShapesAsPaths(): SVGPathItem[] {
    const shapes: SVGPathItem[] = [];

    Array.from(this.doc.querySelectorAll("path")).forEach((path) => {
      const d = path.getAttribute("d") || "";
      if (d.trim()) {
        shapes.push({
          d: d.replace(/[\t\n\r]+/g, " ").trim(),
          styles: this.getElementStyles(path),
          type: "path",
        });
      }
    });

    Array.from(this.doc.querySelectorAll("line")).forEach((line) => {
      const x1 = parseFloat(line.getAttribute("x1") || "0") || 0;
      const y1 = parseFloat(line.getAttribute("y1") || "0") || 0;
      const x2 = parseFloat(line.getAttribute("x2") || "0") || 0;
      const y2 = parseFloat(line.getAttribute("y2") || "0") || 0;

      const pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
      shapes.push({
        d: pathData,
        styles: this.getElementStyles(line),
        type: "line",
      });
    });

    Array.from(this.doc.querySelectorAll("rect")).forEach((rect) => {
      const x = parseFloat(rect.getAttribute("x") || "0") || 0;
      const y = parseFloat(rect.getAttribute("y") || "0") || 0;
      const width = parseFloat(rect.getAttribute("width") || "0") || 0;
      const height = parseFloat(rect.getAttribute("height") || "0") || 0;

      if (width > 0 && height > 0) {
        let pathData: string;

        if (rect.hasAttribute("rx") || rect.hasAttribute("ry")) {
          const rx =
            parseFloat(
              rect.getAttribute("rx") || rect.getAttribute("ry") || "0",
            ) || 0;
          const ry =
            parseFloat(
              rect.getAttribute("ry") || rect.getAttribute("rx") || "0",
            ) || rx;

          const effectiveRx = Math.min(rx, width / 2);
          const effectiveRy = Math.min(ry, height / 2);

          pathData = `M ${x + effectiveRx} ${y} H ${x + width - effectiveRx} A ${effectiveRx} ${effectiveRy} 0 0 1 ${x + width} ${y + effectiveRy} V ${y + height - effectiveRy} A ${effectiveRx} ${effectiveRy} 0 0 1 ${x + width - effectiveRx} ${y + height} H ${x + effectiveRx} A ${effectiveRx} ${effectiveRy} 0 0 1 ${x} ${y + height - effectiveRy} V ${y + effectiveRy} A ${effectiveRx} ${effectiveRy} 0 0 1 ${x + effectiveRx} ${y} Z`;
        } else {
          pathData = `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
        }

        shapes.push({
          d: pathData,
          styles: this.getElementStyles(rect),
          type: "rect",
        });
      }
    });

    Array.from(this.doc.querySelectorAll("circle")).forEach((circle) => {
      const cx = parseFloat(circle.getAttribute("cx") || "0") || 0;
      const cy = parseFloat(circle.getAttribute("cy") || "0") || 0;
      const r = parseFloat(circle.getAttribute("r") || "0") || 0;

      if (r > 0) {
        const pathData = `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
        shapes.push({
          d: pathData,
          styles: this.getElementStyles(circle),
          type: "circle",
        });
      }
    });

    Array.from(this.doc.querySelectorAll("ellipse")).forEach((ellipse) => {
      const cx = parseFloat(ellipse.getAttribute("cx") || "0") || 0;
      const cy = parseFloat(ellipse.getAttribute("cy") || "0") || 0;
      const rx = parseFloat(ellipse.getAttribute("rx") || "0") || 0;
      const ry = parseFloat(ellipse.getAttribute("ry") || "0") || 0;

      if (rx > 0 && ry > 0) {
        const pathData = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
        shapes.push({
          d: pathData,
          styles: this.getElementStyles(ellipse),
          type: "ellipse",
        });
      }
    });

    Array.from(this.doc.querySelectorAll("polyline")).forEach((polyline) => {
      const points = polyline.getAttribute("points") || "";
      if (points.trim()) {
        const coords = points.trim().split(/[\s,]+/);
        if (coords.length >= 2) {
          let pathData = `M ${coords[0]} ${coords[1]}`;
          for (let i = 2; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
              pathData += ` L ${coords[i]} ${coords[i + 1]}`;
            }
          }

          shapes.push({
            d: pathData,
            styles: this.getElementStyles(polyline),
            type: "polyline",
          });
        }
      }
    });

    Array.from(this.doc.querySelectorAll("polygon")).forEach((polygon) => {
      const points = polygon.getAttribute("points") || "";
      if (points.trim()) {
        const coords = points
          .trim()
          .split(/\s+/)
          .filter((coord: string) => coord);
        if (coords.length >= 2) {
          let pathData = `M ${coords[0]} ${coords[1]}`;
          for (let i = 2; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
              pathData += ` L ${coords[i]} ${coords[i + 1]}`;
            }
          }
          pathData += " Z";

          shapes.push({
            d: pathData,
            styles: this.getElementStyles(polygon),
            type: "polygon",
          });
        }
      }
    });

    return shapes.filter((shape) => shape.d && shape.d.trim());
  }

  getMergedPaths(): SVGGroupedItem[] {
    const size = this.size;
    const allShapes = this.getAllShapesAsPaths();

    const groupedShapes: Record<
      string,
      { styles: Record<string, string>; paths: string[] }
    > = {};
    allShapes.forEach((shape) => {
      const styleKey = getStyleKey(shape.styles);
      if (!groupedShapes[styleKey]) {
        groupedShapes[styleKey] = {
          styles: shape.styles,
          paths: [],
        };
      }
      groupedShapes[styleKey].paths.push(shape.d);
    });

    const { vw, vh } = this.getSVGAttributes();
    const result = Object.values(groupedShapes).map((group) => {
      let d = group.paths.join(" ");
      if (size) {
        const scaleX = size / vw;
        const scaleY = size / vh;
        d = viewBoxTransform(d, scaleX, scaleY);
      }
      return {
        d,
        styles: group.styles,
      };
    });

    return result;
  }

  getSVGAttributes(): SVGAttributes {
    const svgElement = this.doc.querySelector("svg")!;

    const xmlns =
      svgElement.getAttribute("xmlns") || "http://www.w3.org/2000/svg";
    const currentWidth = parseInt(svgElement.getAttribute("width") || "24");
    const currentHeight = parseInt(svgElement.getAttribute("height") || "24");

    let viewBox = svgElement.getAttribute("viewBox");
    if (!viewBox) {
      viewBox = `0 0 ${currentWidth} ${currentHeight}`;
    }
    const size = this.size;
    const [vx = 0, vy = 0, vw = size, vh = size] = viewBox
      .split(/\s+/)
      .map(Number);

    return {
      xmlns,
      viewBox,
      vx,
      vy,
      vw,
      vh,
    };
  }
}

const viewBoxTransform = (
  pathData: string,
  scaleX: number,
  scaleY: number,
): string => {
  const paths = new SVGPathData(pathData)
    .scale(scaleX, scaleY)
    .round(2)
    .encode()
    .toString();
  return paths;
};

export const formatStyleAttribute = (
  styles: Record<string, string>,
): string => {
  return Object.entries(styles)
    .map(
      ([key, value]) =>
        `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}:${value}`,
    )
    .join(";");
};

const getStyleKey = (styles: Record<string, string>): string => {
  const sortedEntries = Object.entries(styles).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return JSON.stringify(sortedEntries);
};

export const generateGroupedSVG = (svgContent: string): string => {
  const extractor = new SVGStyleExtractor(svgContent);
  const svgElement = extractor.doc.querySelector("svg")!;

  const svgAttrs = {
    xmlns: svgElement.getAttribute("xmlns"),
    width: svgElement.getAttribute("width"),
    height: svgElement.getAttribute("height"),
    viewBox: svgElement.getAttribute("viewBox"),
  };

  const groupedPaths = extractor.getMergedPaths();

  let newSVG = `<svg xmlns="${svgAttrs.xmlns}" width="${svgAttrs.width}" height="${svgAttrs.height}" viewBox="${svgAttrs.viewBox}">`;

  groupedPaths.forEach((item) => {
    const styleString = formatStyleAttribute(item.styles);
    newSVG += `\n  <path d="${item.d}" style="${styleString}"/>`;
  });

  newSVG += "\n</svg>";

  return newSVG;
};

export const getGroupedPathArray = (
  svgContent: string,
  size: number = 24,
): SVGGroupedItem[] => {
  const extractor = new SVGStyleExtractor(svgContent, size);
  return extractor.getMergedPaths();
};

export const resizeSVG = (
  svgContent: string,
  mergePath: boolean = true,
  targetSize: number = 24,
): string => {
  const extractor = new SVGStyleExtractor(svgContent, targetSize);

  const svgPaths = mergePath
    ? extractor.getMergedPaths()
    : extractor.getAllShapesAsPaths();

  let { viewBox, xmlns, vw, vh } = extractor.getSVGAttributes();
  if (vw !== targetSize || vh !== targetSize) {
    const scaleX = targetSize / vw;
    const scaleY = targetSize / vh;

    const scaledSvgPaths = svgPaths.map((item) => ({
      d: viewBoxTransform(item.d, scaleX, scaleY),
      styles: item.styles,
    }));

    return `<svg xmlns="${xmlns}" width="${targetSize}" height="${targetSize}" viewBox="${viewBox}">
${scaledSvgPaths.map((item) => `  <path d="${item.d}" style="${formatStyleAttribute(item.styles)}"/>`).join("\n")}
</svg>`;
  }

  return `<svg xmlns="${xmlns}" width="${targetSize}" height="${targetSize}" viewBox="${viewBox}">
${svgPaths.map((item) => `  <path d="${item.d}" style="${formatStyleAttribute(item.styles)}"/>`).join("\n")}
</svg>`;
};
