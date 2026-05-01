const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AutoUploadWebpackPlugin = require('./plugins/AutoUploadWebpackPlugin');
const { PASSWORD, REMOTE_PATH } = require('./plugins/config');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin({}),
    new AutoUploadWebpackPlugin({
      host: '101.33.196.88',
      port: 22,
      username: 'root',
      PASSWORD,
      REMOTE_PATH
    })
  ]
};