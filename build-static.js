const webpack = require('webpack')
const chalk = require('chalk')
const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const WebpackBar = require('webpackbar')

webpack({
  mode: 'production',
  entry: {
    main: path.resolve(__dirname, './index.js')
  },
  output: {
    path: path.resolve(__dirname, "./lib"),
    publicPath: "",
    filename: "kui-icons.js",
    library: 'kui-icons',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  performance: {
    hints: false
  },
  module: {
    rules: [
      {
        test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader',
      },
    ]
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          cache: true,
          parallel: true,
          sourceMap: true,
          uglifyOptions: {
            warnings: false,
          },
        }
      }),
    ]
  },
  plugins: [
    new WebpackBar({
      name: '🚙  build kui-icons ....',
      color: 'green',
    }),
  ],
}, function (err, stats) {
  // spinner.stop()
  if (err) throw err
  process.stdout.write(stats.toString({
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }) + '\n\n')

  if (stats.hasErrors()) {
    console.log(chalk.red('  编译出现错误.\n'))
    process.exit(1)
  }

  console.log(chalk.cyan('  编译完成.\n'))
  process.exit()
})