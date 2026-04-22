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
  private rootStyles: Record<string, string>;

  constructor(svgContent: string, size: number = 24) {
    this.size = size;
    const dom = new JSDOM(svgContent);
    this.doc = dom.window.document;
    this.cssRules = this.extractCSSRules();

    const svgElement = this.doc.querySelector("svg");
    this.rootStyles = svgElement ? this.getBasicAttributes(svgElement) : {};
  }

  private getBasicAttributes(element: Element): Record<string, string> {
    const attrs = [
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
    const styles: Record<string, string> = {};
    attrs.forEach((attr) => {
      const value = element.getAttribute(attr);
      if (value !== null) {
        const camelCase = attr.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        styles[camelCase] = value;
      }
    });
    return styles;
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
    // 3. 修改合并顺序：先拿根节点样式打底，再被子元素自身的属性覆盖
    const finalStyles: Record<string, string> = Object.assign(
      {},
      this.rootStyles,
    );

    // 提取当前元素自身的属性
    const stylesFromAttr = this.getBasicAttributes(element);
    Object.assign(finalStyles, stylesFromAttr);

    // 提取 Class 样式
    const classList = (element.getAttribute("class") || "")
      .split(/\s+/)
      .filter(Boolean);
    classList.forEach((cls: string) => {
      const classStyles = this.cssRules[cls];
      if (classStyles) Object.assign(finalStyles, classStyles);
    });

    // 提取内联 Style
    const inlineStyle = element.getAttribute("style") || "";
    const inlineStyles = this.parseStyleAttribute(inlineStyle);
    Object.assign(finalStyles, inlineStyles);

    return finalStyles;
  }

  getAllShapesAsPaths(): SVGPathItem[] {
    const shapes: SVGPathItem[] = [];

    // 统一处理所有形状并转换为 path data
    this.doc
      .querySelectorAll("path, line, rect, circle, ellipse, polyline, polygon")
      .forEach((el) => {
        let d = "";
        const type = el.tagName.toLowerCase();

        if (type === "path") {
          d = el.getAttribute("d") || "";
        } else if (type === "line") {
          const x1 = el.getAttribute("x1") || "0",
            y1 = el.getAttribute("y1") || "0";
          const x2 = el.getAttribute("x2") || "0",
            y2 = el.getAttribute("y2") || "0";
          d = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else if (type === "rect") {
          const x = parseFloat(el.getAttribute("x") || "0"),
            y = parseFloat(el.getAttribute("y") || "0");
          const w = parseFloat(el.getAttribute("width") || "0"),
            h = parseFloat(el.getAttribute("height") || "0");
          const rx = parseFloat(
            el.getAttribute("rx") || el.getAttribute("ry") || "0",
          );
          const ry = parseFloat(
            el.getAttribute("ry") || el.getAttribute("rx") || "0",
          );
          if (rx > 0 || ry > 0) {
            const rX = Math.min(rx, w / 2),
              rY = Math.min(ry, h / 2);
            d = `M ${x + rX} ${y} H ${x + w - rX} A ${rX} ${rY} 0 0 1 ${x + w} ${y + rY} V ${y + h - rY} A ${rX} ${rY} 0 0 1 ${x + w - rX} ${y + h} H ${x + rX} A ${rX} ${rY} 0 0 1 ${x} ${y + h - rY} V ${y + rY} A ${rX} ${rY} 0 0 1 ${x + rX} ${y} Z`;
          } else {
            d = `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
          }
        } else if (type === "circle") {
          const cx = el.getAttribute("cx") || "0",
            cy = el.getAttribute("cy") || "0",
            r = el.getAttribute("r") || "0";
          d = `M ${+cx - +r} ${cy} A ${r} ${r} 0 1 0 ${+cx + +r} ${cy} A ${r} ${r} 0 1 0 ${+cx - +r} ${cy} Z`;
        } else if (type === "ellipse") {
          const cx = el.getAttribute("cx") || "0",
            cy = el.getAttribute("cy") || "0",
            rx = el.getAttribute("rx") || "0",
            ry = el.getAttribute("ry") || "0";
          d = `M ${+cx - +rx} ${cy} A ${rx} ${ry} 0 1 0 ${+cx + +rx} ${cy} A ${rx} ${ry} 0 1 0 ${+cx - +rx} ${cy} Z`;
        } else if (type === "polyline" || type === "polygon") {
          const points = (el.getAttribute("points") || "")
            .trim()
            .split(/[\s,]+/)
            .filter(Boolean);
          if (points.length >= 2) {
            d = `M ${points[0]} ${points[1]}`;
            for (let i = 2; i < points.length; i += 2)
              d += ` L ${points[i]} ${points[i + 1]}`;
            if (type === "polygon") d += " Z";
          }
        }

        if (d.trim()) {
          shapes.push({
            d: d.replace(/[\t\n\r]+/g, " ").trim(),
            styles: this.getElementStyles(el),
            type,
          });
        }
      });

    return shapes;
  }

  getMergedPaths(): SVGGroupedItem[] {
    const allShapes = this.getAllShapesAsPaths();
    const groupedShapes: Record<
      string,
      { styles: Record<string, string>; paths: string[] }
    > = {};

    allShapes.forEach((shape) => {
      const styleKey = getStyleKey(shape.styles);
      if (!groupedShapes[styleKey]) {
        groupedShapes[styleKey] = { styles: shape.styles, paths: [] };
      }
      groupedShapes[styleKey].paths.push(shape.d);
    });

    const { vw, vh } = this.getSVGAttributes();
    const scaleX = this.size / vw;
    const scaleY = this.size / vh;

    return Object.values(groupedShapes).map((group) => {
      // 修复核心：合并前先对每一条路径转绝对坐标并缩放
      const absolutePaths = group.paths.map((pathStr) =>
        viewBoxTransform(pathStr, scaleX, scaleY),
      );

      return {
        d: absolutePaths.join(" "),
        styles: group.styles,
      };
    });
  }

  getSVGAttributes(): SVGAttributes {
    const svgElement = this.doc.querySelector("svg")!;
    const xmlns =
      svgElement.getAttribute("xmlns") || "http://www.w3.org/2000/svg";
    const currentWidth = parseInt(svgElement.getAttribute("width") || "24");
    const currentHeight = parseInt(svgElement.getAttribute("height") || "24");
    let viewBox =
      svgElement.getAttribute("viewBox") ||
      `0 0 ${currentWidth} ${currentHeight}`;
    const [vx = 0, vy = 0, vw = 24, vh = 24] = viewBox.split(/\s+/).map(Number);

    return { xmlns, viewBox, vx, vy, vw, vh };
  }
}

/**
 * 修复函数：转换绝对坐标，处理缩放，提高精度
 */
const viewBoxTransform = (
  pathData: string,
  scaleX: number,
  scaleY: number,
): string => {
  try {
    return new SVGPathData(pathData)
      .toAbs() // 必须转为绝对坐标，否则合并后相对坐标会出错
      .scale(scaleX, scaleY)
      .round(4) // 提高精度到3位，防止 0.923 这种坐标丢失
      .encode()
      .replace(/([A-Za-z])\s+/g, "$1") // 移除指令后的多余空格
      .replace(/\s+/g, " ") // 合并连续空格
      .trim();
  } catch (e) {
    return pathData;
  }
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
  return JSON.stringify(
    Object.entries(styles).sort(([a], [b]) => a.localeCompare(b)),
  );
};

export const getGroupedPathArray = (
  svgContent: string,
  size: number = 24,
): SVGGroupedItem[] => {
  const extractor = new SVGStyleExtractor(svgContent, size);
  return extractor.getMergedPaths();
};
