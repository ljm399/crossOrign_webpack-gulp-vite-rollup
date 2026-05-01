const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { babel } = require('@rollup/plugin-babel');
const terser = require('@rollup/plugin-terser');

// rollup.config.js
module.exports =  {
  // 从哪个入口开始打包
  input: './src/index.js',

  // 哪些依赖不打进产物（做库通常 external）
  // 常见：react/vue/lodash 等
  external: ['lodash'],

  // 一个库经常要输出多种格式（给不同环境用）
  output: [
    // esm：给现代 bundler（Vite/webpack/rollup）使用
    {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },

    // node：CommonJS
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true
    },

    // browser：脚本直引（更纯粹的浏览器场景）
    {
      file: 'dist/index.iife.js',
      format: 'iife',
      name: 'MyLib',
      globals: {
        lodash: '_'
      },
      sourcemap: true
    },

    // umd：同时兼容 browser/amd/cjs
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'MyLib',
      globals: {
        lodash: '_'
      },
      sourcemap: true
    },

    // amd：RequireJS 环境（了解即可）
    {
      file: 'dist/index.amd.js',
      format: 'amd',
      sourcemap: true
    }
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env'],
      exclude: 'node_modules/**'
    }),
    terser()
  ]
}