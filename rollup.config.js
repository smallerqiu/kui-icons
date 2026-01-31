
import pkg from './package.json'
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'

const bannerText = `/*!
 * ${pkg.name} v${pkg.version}
 * Copyright 2017-present, kui-icons.
 * All rights reserved.
 * Homepage: https://k-ui.cn
 * Author: Qiu / https://chuchur.com
 */\n`


export default [
  {
    input: 'dist/icons.js',
    output: [
      {
        file: 'dist/kui-icons.esm.js',
        format: 'es',
        banner: bannerText,
        exports: 'named'
      },
      {
        file: 'dist/kui-icons.cjs.js',
        format: 'cjs',
        banner: bannerText,
        exports: 'named'
      },
      {
        file: 'dist/kui-icons.umd.js',
        format: 'umd',
        name: 'kui',
        exports: 'named',
        banner: bannerText,
      },
    ],
    plugins: [
      commonjs({ include: 'node_modules/**' }),
      terser(),
    ]
  },
]