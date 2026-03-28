import fs from "fs";
import { generate, GenerateResult } from "./utils/pathify";

const { spriteList, pathList }: GenerateResult = generate("./source/*.svg");

fs.writeFileSync("./dist/icons.js", pathList.join("\n"));

// 生成 TypeScript 类型声明文件
const iconNames: string[] = [];
pathList.forEach((line) => {
  const match = line.match(/export const (\w+) = /);
  if (match) iconNames.push(match[1]);
});

const typeDeclaration = `/**
 * kui-icons - SVG Icon Library
 * Type declarations for dynamically generated icon exports
 */

export interface SVGPathItem {
  /** Path data (d attribute) */
  d: string;
  /** Style string */
  s: string;
}
${iconNames.map(name => `export const ${name}: SVGPathItem[];`).join('\n')}
`;

fs.writeFileSync("./dist/index.d.ts", typeDeclaration);

// output svg sprite
fs.writeFileSync(
  "./dist/sprite.svg",
  `<svg version="1.1" xmlns="http://www.w3.org/2000/svg">${spriteList.join("")}</svg>`
);
