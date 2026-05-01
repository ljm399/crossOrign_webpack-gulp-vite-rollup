const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          // 2.1/2.2：基础单 loader（字符串替换）
          // path.resolve(__dirname, './hy-loaders/hy_loader01.js'),

          // 2.1：多个 loader 串联（观察 normal 从右到左）
          path.resolve(__dirname, './hy-loaders/hy_loader01.js'),
          // path.resolve(__dirname, './hy-loaders/hy_loader02.js'),

          // 2.2：pitch/normal（观察两个阶段，下面代码位置是45行）

          // 2.3：异步 loader（setTimeout）
          // path.resolve(__dirname, './hy-loaders/hy_loader04.js'),

          // 2.4：this.getOptions（options 传参）
          // {
          //   loader: path.resolve(__dirname, './hy-loaders/hy_loader05.js'),
          //   options: {
          //     prefix: '// hello from options'
          //   }
          // },

          // 2.4：validate（schema-utils 校验 options）
          {
            loader: path.resolve(__dirname, './hy-loaders/hy_loader06.js'),
            options: {
              hyprefix: '// validated prefix',
              numb: 123
            }
          }
        ]
      },

      // 2.2：enforce: pre/post（注意：enforce 只能写在 rule 上，不能写在 use 的单项上）
      // {
      //   test: /\.js$/,
      //   // enforce: 'pre',
      //   use: [path.resolve(__dirname, './hy-loaders/hy_loader03.js')]
      // },
      // {
      //   test: /\.js$/,
      //   use: [
      //     path.resolve(__dirname, './hy-loaders/hy_loader02.js'),
      //     path.resolve(__dirname, './hy-loaders/hy_loader01.js')
      //   ]
      // },
      // {
      //   test: /\.js$/,
      //   // enforce: 'post',
      //   use: [path.resolve(__dirname, './hy-loaders/hy_loader03b.js')]
      // }
    ]
  }
}
