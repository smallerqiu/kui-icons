import fs from "fs";
import { generate } from "./utils/pathify.js";

const { spriteList, pathList } = generate("./source/*.svg");

fs.writeFileSync("./dist/icons.js", pathList.join("\n"));

// out put svg sprite
fs.writeFileSync(
  "./dist/sprite.svg",
  `<svg version="1.1" xmlns="http://www.w3.org/2000/svg">${spriteList}</svg>`,
);
