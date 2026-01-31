import { JSDOM } from "jsdom";
import { SVGPathData } from "svg-pathdata";

class SVGStyleExtractor {
  constructor(svgContent, size = 512) {
    this.size = size;
    this.svgContent = svgContent;
    const dom = new JSDOM(svgContent);
    this.doc = dom.window.document;

    this.cssRules = this.extractCSSRules();
  }
  // 提取 <style> 标签中的 CSS 规则，返回类名到样式的映射
  extractCSSRules() {
    const rules = {};
    const styleSheets = this.doc.querySelectorAll("style");
    styleSheets.forEach((styleTag) => {
      const cssText = styleTag.textContent || "";
      // 简单解析 .className { ... } 结构
      const matches = cssText.matchAll(/\.([^{]+)\s*\{([^}]+)\}/g);
      for (const match of matches) {
        const className = match[1].trim();
        const styleBody = match[2];
        // 转换为驼峰对象
        const styles = this.parseStyleAttribute(styleBody);
        rules[className] = styles;
      }
    });
    return rules;
  }

  // 解析 style 属性字符串
  parseStyleAttribute(styleString) {
    const styles = {};
    if (!styleString) return styles;

    styleString.split(";").forEach((rule) => {
      const [property, value] = rule.split(":");
      if (property && value) {
        const propName = property
          .trim()
          .replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        styles[propName] = value.trim();
      }
    });

    return styles;
  }
  // 获取元素的完整样式（合并 class + inline style）
  getElementStyles(element) {
    const finalStyles = {};

    //  应用 presentation attributes（fill, stroke, stroke-width 等）
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

    const stylesFromAttr = {};
    presentationAttrs.forEach((attr) => {
      const value = element.getAttribute(attr);
      if (value !== null && value !== undefined) {
        const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        stylesFromAttr[camelCase] = value;
      }
    });

    Object.assign(finalStyles, stylesFromAttr);

    // 应用 class 样式
    const classList = (element.getAttribute("class") || "")
      .split(/\s+/)
      .filter(Boolean);
    classList.forEach((cls) => {
      const classStyles = this.cssRules[cls];
      if (classStyles) {
        Object.assign(finalStyles, classStyles);
      }
    });

    // 覆盖内联 style
    const inlineStyle = element.getAttribute("style") || "";
    const inlineStyles = this.parseStyleAttribute(inlineStyle);
    Object.assign(finalStyles, inlineStyles);

    return finalStyles;
  }

  // 将所有 SVG 形状转换为路径（包括 line, rect, circle, ellipse, polyline, polygon）
  getAllShapesAsPaths() {
    const shapes = [];

    // 处理 path 元素
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

    // 处理 line 元素
    Array.from(this.doc.querySelectorAll("line")).forEach((line) => {
      const x1 = parseFloat(line.getAttribute("x1")) || 0;
      const y1 = parseFloat(line.getAttribute("y1")) || 0;
      const x2 = parseFloat(line.getAttribute("x2")) || 0;
      const y2 = parseFloat(line.getAttribute("y2")) || 0;

      const pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
      shapes.push({
        d: pathData,
        styles: this.getElementStyles(line),
        type: "line",
      });
    });

    // 处理 rect 元素
    Array.from(this.doc.querySelectorAll("rect")).forEach((rect) => {
      const x = parseFloat(rect.getAttribute("x")) || 0;
      const y = parseFloat(rect.getAttribute("y")) || 0;
      const width = parseFloat(rect.getAttribute("width")) || 0;
      const height = parseFloat(rect.getAttribute("height")) || 0;

      if (width > 0 && height > 0) {
        let pathData;
        if (rect.hasAttribute("rx") || rect.hasAttribute("ry")) {
          // 处理圆角矩形
          const rx =
            parseFloat(rect.getAttribute("rx")) ||
            parseFloat(rect.getAttribute("ry")) ||
            0;
          const ry =
            parseFloat(rect.getAttribute("ry")) ||
            parseFloat(rect.getAttribute("rx")) ||
            rx;

          if (rx > width / 2) rx = width / 2;
          if (ry > height / 2) ry = height / 2;

          pathData = `M ${x + rx} ${y} H ${x + width - rx} A ${rx} ${ry} 0 0 1 ${x + width} ${y + ry} V ${y + height - ry} A ${rx} ${ry} 0 0 1 ${x + width - rx} ${y + height} H ${x + rx} A ${rx} ${ry} 0 0 1 ${x} ${y + height - ry} V ${y + ry} A ${rx} ${ry} 0 0 1 ${x + rx} ${y} Z`;
        } else {
          // 普通矩形
          pathData = `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
        }

        shapes.push({
          d: pathData,
          styles: this.getElementStyles(rect),
          type: "rect",
        });
      }
    });

    // 处理 circle 元素
    Array.from(this.doc.querySelectorAll("circle")).forEach((circle) => {
      const cx = parseFloat(circle.getAttribute("cx")) || 0;
      const cy = parseFloat(circle.getAttribute("cy")) || 0;
      const r = parseFloat(circle.getAttribute("r")) || 0;

      if (r > 0) {
        const pathData = `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
        shapes.push({
          d: pathData,
          styles: this.getElementStyles(circle),
          type: "circle",
        });
      }
    });

    // 处理 ellipse 元素
    Array.from(this.doc.querySelectorAll("ellipse")).forEach((ellipse) => {
      const cx = parseFloat(ellipse.getAttribute("cx")) || 0;
      const cy = parseFloat(ellipse.getAttribute("cy")) || 0;
      const rx = parseFloat(ellipse.getAttribute("rx")) || 0;
      const ry = parseFloat(ellipse.getAttribute("ry")) || 0;

      if (rx > 0 && ry > 0) {
        const pathData = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
        shapes.push({
          d: pathData,
          styles: this.getElementStyles(ellipse),
          type: "ellipse",
        });
      }
    });

    // 处理 polyline 元素
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

    // 处理 polygon 元素
    Array.from(this.doc.querySelectorAll("polygon")).forEach((polygon) => {
      const points = polygon.getAttribute("points") || "";
      if (points.trim()) {
        const coords = points
          .trim()
          .split(/\s+/)
          .filter((coord) => coord);
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

  getMergedPaths(size = null) {
    const allShapes = this.getAllShapesAsPaths();

    // 按样式分组
    const groupedShapes = {};
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

    // 将每组的路径合并
    const { vw, vh } = this.getSVGAttributes();
    const result = Object.values(groupedShapes).map((group) => {
      let d = group.paths.join(" ");
      if (size) {
        const scaleX = size / vw;
        const scaleY = size / vh;
        d = viewBoxTransform(d, scaleX, scaleY);
      }
      return {
        d: d,
        styles: group.styles,
      };
    });

    return result;
  }

  getSVGAttributes() {
    const svgElement = this.doc.querySelector("svg");

    // 获取原始属性
    const xmlns =
      svgElement.getAttribute("xmlns") || "http://www.w3.org/2000/svg";
    const currentWidth = parseInt(svgElement.getAttribute("width")) || 512;
    const currentHeight = parseInt(svgElement.getAttribute("height")) || 512;

    // 获取或构建原始 viewBox
    let viewBox = svgElement.getAttribute("viewBox");
    if (!viewBox) {
      viewBox = `0 0 ${currentWidth} ${currentHeight}`;
    }
    const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number);

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

const viewBoxTransform = (pathData, scaleX, scaleY) => {
  const paths = new SVGPathData(pathData)
    .scale(scaleX, scaleY)
    .round(2)
    .encode()
    .toString();
  // console.log(paths);
  return paths;
  // .translate(-cx, -cy)
  // .scale(scaleX)
  // .translate(cx, cy)
  // .encode();
};
// 格式化样式属性
const formatStyleAttribute = (styles) => {
  return Object.entries(styles)
    .map(
      ([key, value]) =>
        `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}:${value}`,
    )
    .join(";");
};

// 将样式对象转换为唯一标识字符串，用于分组
const getStyleKey = (styles) => {
  const sortedEntries = Object.entries(styles).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return JSON.stringify(sortedEntries);
};

// 生成合path并后的 SVG（按样式分组）
const generateGroupedSVG = (svgContent) => {
  const extractor = new SVGStyleExtractor(svgContent);
  const svgElement = extractor.doc.querySelector("svg");

  // 提取 SVG 基本属性
  const svgAttrs = {
    xmlns: svgElement.getAttribute("xmlns"),
    width: svgElement.getAttribute("width"),
    height: svgElement.getAttribute("height"),
    viewBox: svgElement.getAttribute("viewBox"),
  };

  // 按样式分组合并
  const groupedPaths = extractor.getMergedPaths();

  // 生成 SVG
  let newSVG = `<svg xmlns="${svgAttrs.xmlns}" width="${svgAttrs.width}" height="${svgAttrs.height}" viewBox="${svgAttrs.viewBox}">`;

  groupedPaths.forEach((item, index) => {
    const styleString = formatStyleAttribute(item.styles);
    newSVG += `\n  <path d="${item.d}" style="${styleString}"/>`;
  });

  newSVG += "\n</svg>";

  return newSVG;
};

// 返回路径数组（按样式分组）
const getGroupedPathArray = (svgContent, size = 512) => {
  const extractor = new SVGStyleExtractor(svgContent);
  return extractor.getMergedPaths(size);
};

// 缩放并合并path
const resizeSVG = (svgContent, mergePath = true, targetSize = 512) => {
  const extractor = new SVGStyleExtractor(svgContent);

  // 提取所有形状并按样式分组
  let svgPaths = mergePath
    ? extractor.getMergedPaths()
    : extractor.getAllShapesAsPaths();

  // 如果 viewBox 已经是目标大小，则不需要变换
  let { viewBox, xmlns, vx, vy, vw, vh } = extractor.getSVGAttributes();
  if (vw !== targetSize || vh !== targetSize) {
    const scaleX = targetSize / vw;
    const scaleY = targetSize / vh;

    svgPaths = svgPaths.map((item) => ({
      d: viewBoxTransform(item.d, scaleX, scaleY),
      styles: item.styles,
    }));
    viewBox = `${vx} ${vy} ${targetSize} ${targetSize}`;
  }

  return `<svg xmlns="${xmlns}" width="${targetSize}" height="${targetSize}" viewBox="${viewBox}">
${svgPaths.map((item, index) => `  <path d="${item.d}" style="${formatStyleAttribute(item.styles)}"/>`).join("\n")}
</svg>`;
};

export {
  formatStyleAttribute,
  generateGroupedSVG,
  getGroupedPathArray,
  resizeSVG,
};

// 使用示例
/**
let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <ellipse cx="256" cy="128" rx="192" ry="80" style="fill:none;stroke:#000;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px"/>
    <path d="M448,214c0,44.18-86,80-192,80S64,258.18,64,214" style="fill:none;stroke:#000;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px"/>
    <path d="M448,300c0,44.18-86,80-192,80S64,344.18,64,300" style="fill:none;stroke:#000;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px"/>
    <path d="M64,127.24V384.76C64,428.52,150,464,256,464s192-35.48,192-79.24V127.24" style="fill:none;stroke:#000;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px"/>
</svg>`;

svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <path d="M448,256c0-106-86-192-192-192S64,150,64,256s86,192,192,192S448,362,448,256Z" style="fill:none;stroke:#000;stroke-miterlimit:10;stroke-width:32px"/>
  <line x1="256" y1="176" x2="256" y2="336" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/>
  <line x1="336" y1="256" x2="176" y2="256" style="fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"/>
</svg>`;

const result = getGroupedPathArray(svgContent);
console.log(result);
const result1 = generateGroupedSVG(svgContent);
console.log(result1);

 */
