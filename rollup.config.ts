import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import fs from "fs";
import path from "path";
import type { RollupOptions } from "rollup";

const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf-8"));

const bannerText = `/*!
 * ${pkg.name} v${pkg.version}
 * Copyright 2017-present, kui-icons.
 * All rights reserved.
 * Homepage: https://k-ui.cn
 * Author: Qiu / https://chuchur.com
 */\n`;

const basePlugins = [json(), commonjs({ include: "node_modules/**" })];

const config: RollupOptions[] = [
  {
    input: "dist/icons.js",
    output: {
      file: "dist/kui-icons.esm.js",
      format: "es",
      banner: bannerText,
      exports: "named",
    },
    plugins: basePlugins,
  },
  {
    input: "dist/icons.js",
    output: {
      file: "dist/kui-icons.cjs.js",
      format: "cjs",
      banner: bannerText,
      exports: "named",
    },
    plugins: basePlugins,
  },
  {
    input: "dist/icons.js",
    output: {
      file: "dist/kui-icons.umd.js",
      format: "umd",
      name: "kui",
      exports: "named",
      banner: bannerText,
    },
    plugins: [...basePlugins, terser()],
  },
];

export default config;
