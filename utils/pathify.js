import path from "path";
import fs from "fs";
import { getGroupedPathArray, formatStyleAttribute } from "./parse.js";
import glob from "fast-glob";

const toPascalCase = (str = "") => {
  return str
    .split("-")
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

export const generate = (inputPath) => {
  const pathList = [];
  const spriteList = [];
  const matches = glob.sync(inputPath);

  for (const file of matches) {
    // console.log(file);
    // const parts = file.split(path.sep);
    const name = path.parse(file).name;
    const pascalName = toPascalCase(name);

    const svgContent = fs.readFileSync(file, "utf-8");
    const array = getGroupedPathArray(svgContent);
    // console.log(array);

    let items = [];
    let paths = [];
    array.forEach((item) => {
      let { fill = "", stroke = "" } = item.styles;

      if (stroke && stroke !== "none") {
        item.styles.stroke = "currentcolor";
      }
      if ((fill && fill !== "none") || Object.keys(item.styles).length === 0) {
        item.styles.fill = "currentcolor";
      }
      let style = formatStyleAttribute(item.styles);
      items.push(`{d: "${item.d}", s: "${style}"}`);
      paths.push(`<path d="${item.d}" style="${style}" />`);
    });
    pathList.push(`export const ${pascalName} = [${items}]`);
    spriteList.push(
      `<symbol id="${pascalName}" viewBox="0 0 512 512">${paths.join("")}</symbol>`,
    );
    // console.log(pathList);
    console.log(`output: ${pascalName}`);
  }
  return {
    pathList,
    spriteList,
  };
};
