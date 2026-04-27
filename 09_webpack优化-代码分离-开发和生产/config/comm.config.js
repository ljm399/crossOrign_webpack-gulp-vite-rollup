const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env, argv) => {
  const isProduction = argv?.mode === 'production'
  const styleLoader = isProduction ? MiniCssExtractPlugin.loader : 'style-loader'

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: isProduction ? 'js/[name].[contenthash].js' : 'js/[name].bundle.js',
      chunkFilename: isProduction ? 'js/[name].[contenthash].chunk.js' : 'js/[name].chunk.js',
      clean: true,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    },
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                type: 'javascript/auto',
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    // 方式一（已淘汰）
                    // options: {
                    //     plugins: [
                    //         '@babel/plugin-transform-arrow-functions',
                    //         '@babel/plugin-transform-block-scoping'
                    //     ]
                    // }

                    // 方式二
                    // options: {
                    //     presets: ['@babel/preset-env']
                    // }

                    // 方式三：presets放入babel.config.js中
                }
            },
            // {
            //     test: /\.tsx?$/,
            //     exclude: /node_modules/,
            //     use: 'babel-loader'
            // },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: 'asset/resource'
            },
            {
                test: /\.css$/,
                use: [
                // 开发环境常用 style-loader（CSS 注入到 <style>）
                // 生产环境用 MiniCssExtractPlugin.loader（抽离成单独 css 文件）
                styleLoader,
                'css-loader', // 解析css
                ],
            },
        ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, '../public/view1.jpg'),
            to: path.resolve(__dirname, '../dist/view1.jpg'),
          },
        ],
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: 'css/[name].[contenthash].css',
              chunkFilename: 'css/[id].[contenthash].css',
            }),
          ]
        : []),
    ],
  }
}
