const { merge } = require('webpack-merge')
const common = require('./comm.config')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = (env, argv) =>
  merge(common(env, argv), {
    mode: 'production',
    devtool: 'source-map',
    optimization: {
      minimize: true,
      minimizer: ['...', new CssMinimizerPlugin()],
    },
  })
