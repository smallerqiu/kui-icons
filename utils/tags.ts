import glob from "fast-glob";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const matches = glob.sync(path.resolve(__dirname, "../tags/*.json"));

let tags: any[] = [];
for (const file of matches) {
  const name = path.parse(file).name;
  const content = fs.readFileSync(file, "utf-8");
  const data = JSON.parse(content);
  // let tagName = toPascalCase(name);
  tags.push({ name: name, tags: data.tags });
}

fs.writeFileSync(
  path.resolve(__dirname, "../dist/tags.ts"),
  `export const tags = ${JSON.stringify(tags, null, 2)};`,
);
