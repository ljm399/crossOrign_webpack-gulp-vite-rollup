const webpack = require('../lib/webpack')
const config = require('./webpack.config')

const compiler = webpack(config)

compiler.run((err, stats) => {
  if (err) {
    console.error(err)
    return
  }

  if (stats?.hasErrors()) {
    console.error(stats.toString({ colors: true }))
    compiler.close(() => {})
    return
  }

  console.log(stats.toString({ colors: true }))
  compiler.close(() => {})
})
