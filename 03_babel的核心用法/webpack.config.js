const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    mode: 'development',
    devtool: 'eval',
    entry: './src/index.js',
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),

        // 清空bundle-,默认为true
        clean:true
    },
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
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
            // }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html'
        })
    ]
};
