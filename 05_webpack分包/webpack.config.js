const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    mode: 'development',
    devtool: 'eval',
    entry: './src/index.js',

    // 多入口起点: 修改1
    // entry: {
    //     main: './src/main.js',
    //     index: './src/index.js'
    // },
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx']
    },
    externals:{
        react:"React"
    },
    output: {
            // 多入口起点: 修改2
        filename: '[name].bundle.js',

        // 分包的名字
        chunkFilename: '[name].chunk.js',

        path: path.resolve(__dirname, 'dist'),

        // 清空bundle-,默认为true
        clean:true,

        // 当全部资源配置到cdn中
        // publicPath:'127.0.0.1:8000'
    },
    optimization: {
        // runtimeChunk: true,
        // 自定义 runtime chunk 名称
        runtimeChunk: { name: 'runtimetttttt' },
        chunkIds: 'named',
        splitChunks: {
            chunks: 'all',
            maxSize: 40000,
            minSize:100,
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    filename: '[id]_vendors.js'
                },
                utils: {
                    test: /utils/,
                    name: 'utils',
                    minChunks: 1,
                    enforce: true,
                    priority: 0,
                    filename: '[id]_utils.js'
                }
            },
        },
        minimize:true,
        minimizer:[
            new TerserPlugin({
                extractComments: false,
            }),
            new CssMinimizerPlugin(),
        ]
    },
    devServer: {
        host: '0.0.0.0',
        compress: true,
        port: 9000,
        open: true,
        historyApiFallback:true,
        // 跨域
        proxy: [
            {
                context: ['/api'],
                target: 'http://localhost:8000',
                changeOrigin: false,
                pathRewrite: {
                    '^/api': ''
                }
            }
        ]
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
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
            {
                from: path.resolve(__dirname, 'public/view1.jpg'),
                to: path.resolve(__dirname, 'dist/view1.jpg'),
            },
    ],
  }),
    ]
};
