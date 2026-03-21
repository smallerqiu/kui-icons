import path from "path";
import fs from "fs";
import { getGroupedPathArray, formatStyleAttribute, SVGGroupedItem } from "./parse";
import glob from "fast-glob";

const toPascalCase = (str: string = ""): string => {
  return str
    .split("-")
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

export interface GenerateResult {
  pathList: string[];
  spriteList: string[];
}

export const generate = (inputPath: string): GenerateResult => {
  const pathList: string[] = [];
  const spriteList: string[] = [];
  const matches = glob.sync(inputPath);

  for (const file of matches) {
    const name = path.parse(file).name;
    const pascalName = toPascalCase(name);

    const svgContent = fs.readFileSync(file, "utf-8");
    const array: SVGGroupedItem[] = getGroupedPathArray(svgContent);

    const items: string[] = [];
    const paths: string[] = [];

    array.forEach((item) => {
      let { fill = "", stroke = "" } = item.styles;

      if (stroke && stroke !== "none") {
        item.styles.stroke = "currentcolor";
      }
      if ((fill && fill !== "none") || Object.keys(item.styles).length === 0) {
        item.styles.fill = "currentcolor";
      }

      const style = formatStyleAttribute(item.styles);
      items.push(`{d: "${item.d}", s: "${style}"}`);
      paths.push(`<path d="${item.d}" style="${style}" />`);
    });

    pathList.push(`export const ${pascalName} = [${items}]`);
    spriteList.push(
      `<symbol id="${pascalName}" viewBox="0 0 512 512">${paths.join("")}</symbol>`
    );

    console.log(`output: ${pascalName}`);
  }

  return {
    pathList,
    spriteList,
  };
};
