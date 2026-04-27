const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env, argv) => {
    const mode = argv?.mode || 'development'
    const isProd = mode === 'production'

    return {
        mode,
        devtool: isProd ? 'source-map' : 'eval',
        // entry: './src/index.js',

        cache: {
            type: 'filesystem',
            name: `webpack-cache-${mode}`,
            cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
            buildDependencies: {
                config: [__filename],
            },
        },

        
        // 多入口起点: 修改1
        entry: {
            // main: './src/main.js',
            index: './src/index.js'
        },
        resolve: {
            extensions: ['.js', '.jsx', '.json', '.ts', '.tsx']
        },
        externals: {
            react: "React"
        },
        output: {
            // 多入口起点: 修改2
            filename: 'js/[name].bundle.js',

        // 分包的名字
        chunkFilename: 'js/[name].chunk.js',

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
                minSize: 100,
                cacheGroups: {
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                        filename: 'js/[id]_vendors.js'
                    },
                    utils: {
                        test: /utils/,
                        name: 'utils',
                        minChunks: 1,
                        enforce: true,
                        priority: 0,
                        filename: 'js/[id]_utils.js'
                    }
                },
            },
            minimize: isProd,
            minimizer: isProd
                ? [
                    new TerserPlugin({
                        extractComments: false,
                        terserOptions: {
                            compress: {
                                arguments: true,
                                drop_console: true,
                                drop_debugger: true,
                                pure_funcs: ['console.log'],
                            },
                            mangle: true,
                            keep_classnames: true,
                            keep_fnames: true,
                            toplevel: true,
                        },
                    }),
                ]
                : [],
        },
        devServer: {
            host: '0.0.0.0',
            compress: true,
            port: 9000,
            open: true,
            historyApiFallback: true,
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
                },
                {
                    test: /\.css$/,
                    use: [
                        // 开发环境常用 style-loader（CSS 注入到 <style>）
                        // 生产环境用 MiniCssExtractPlugin.loader（抽离成单独 css 文件）
                        MiniCssExtractPlugin.loader,
                        'css-loader', // 解析css
                    ],
                },
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
            new MiniCssExtractPlugin({
                filename: 'css/[name].[contenthash].css',
                chunkFilename: 'css/[id].[contenthash].css',
            }),

        ]
    }
}
