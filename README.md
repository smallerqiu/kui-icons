# Icon 图标

一起422个图标, 部分图标引用了 `ionicons` ,可以在 `kui-vue` 和 `react-kui` 中使用。

使用图标组件，你需要安装 `kui-icons` 图标组件包：

```sh
npm install --save kui-icons
```

在 Vue 中使用

```vue
import { Icon } from 'kui-vue' import { Heart } from 'kui-icons'

<Icon :type="Heart" />
```

## 使用Sprite模式

```vue
import sprite from 'kui-icons/dist/sprite.svg'

<svg width="1em" height="1em">
  <use xlink:href={`${sprite}#logo-kui`}></use>
</svg>
```

## 辅助函数

### resizeSVG

合并SVG 所有的Path 元素,包括 `path` , `rect` , `circle`, `ellipse`, `polygon`, `polyline`, `line`

```js
import { resizeSVG } from "kui-icons/utils/parse.js";

let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <ellipse cx="256" cy="128" rx="192" ry="80" style="fill:none;stroke:#000;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px"/>
    <path d="M448,214c0,44.18-86,80-192,80S64,258.18,64,214" style="fill:none;stroke:#000;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px"/>
    <path d="M448,300c0,44.18-86,80-192,80S64,344.18,64,300" style="fill:none;stroke:#000;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px"/>
    <path d="M64,127.24V384.76C64,428.52,150,464,256,464s192-35.48,192-79.24V127.24" style="fill:none;stroke:#000;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px"/>
</svg>`;

// 合并所有path,并缩放viewbox 为300*300
const svg = resizeSVG(svgContent, true, 300);
```

out put:

```html
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="300"
  height="300"
  viewBox="0 0 300 300"
>
  <path
    d="M262.5 125.5c0 26 -50.5 47 -112.5 47S37.5 151.5 37.5 125.5M262.5 176c0 26 -50.5 47 -112.5 47S37.5 201.5 37.5 176M37.5 74.5V225.5C37.5 251 88 272 150 272s112.5 -21 112.5 -46.5V74.5M37.5 75A112.5 47 0 1 0 262.5 75A112.5 47 0 1 0 37.5 75z"
    style="fill:none;stroke:#000;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px"
  />
</svg>
```

### generate

把多个SVG文件合并成一个文件,生成`sprite.svg`文件,自动合并所有path, 自动提取`styles`, 自动统一`viewBox`

```js
import fs from "fs";
import { generate } from "kui-icons/utils/pathify.js";

// 读取source目录所有的 svg 文件
const { spriteList } = generate("./source/*.svg");

// out put svg sprite
fs.writeFileSync(
  "./dist/sprite.svg",
  `<svg version="1.1" xmlns="http://www.w3.org/2000/svg">${spriteList}</svg>`,
);
```
