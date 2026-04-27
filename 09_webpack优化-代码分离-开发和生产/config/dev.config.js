const { merge } = require('webpack-merge')
const common = require('./comm.config')

module.exports = (env, argv) =>
  merge(common(env, argv), {
    mode: 'development',
    devtool: 'eval',
    devServer: {
      open: true,
      port: 9000,
    },
  })
