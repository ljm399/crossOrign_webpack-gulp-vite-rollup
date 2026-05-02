const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const vue = require('rollup-plugin-vue');
const postcss = require('rollup-plugin-postcss');
const postcssPresetEnv = require('postcss-preset-env');
const serve = require('rollup-plugin-serve');
const livereload = require('rollup-plugin-livereload');
const terser = require('@rollup/plugin-terser');

const isProd = process.env.NODE_ENV === 'production';
const plugins = [
  replace({
    preventAssignment: true,
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development')
  }),
  vue({
    css: true,
    compileTemplate: true
  }),
  postcss({
    extract: true,
    minimize: isProd,
    sourceMap: !isProd,
    plugins: [
      postcssPresetEnv()
    ]
  }),
  nodeResolve({
    browser: true,
    extensions: ['.mjs', '.js', '.json', '.vue']
  }),
  commonjs()
];

if (isProd) {
  plugins.push(terser());
} else {
  plugins.push(
    serve({
      open: true,
      contentBase: ['.', 'dist'],
      port: 8080
    }),
    livereload('dist')
  );
}

module.exports = {
  input: './src/index.js',
  output: {
    file: 'dist/bundle.iife.js',
    format: 'iife',
    name: 'App',
    sourcemap: !isProd
  },
  plugins: plugins
};
