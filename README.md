# kui-icons

# Icon 图标
kui 的图标使用开源项目 ionicons 前版本5.5

3.x 版本以后不再支持webfont 使用 svg代替

使用图标组件，你需要安装 kui-icons 图标组件包：

```sh
npm install --save kui-icons
```

>3.1.1 版本之后 使用 ionicons 图标库 5.5 版本, 5.0 图标库请配合 kui-vue@3.1.0

# 使用Sprite模式

```vue
import sprite from 'kui-icons/lib/sprite.svg'


<svg width="1em" height="1em">
  <use xlink:href={`${sprite}#logo-kui`}></use>
</svg>

```
