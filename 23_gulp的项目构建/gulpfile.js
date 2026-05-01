const { src, dest, watch, parallel, series } = require('gulp');
const htmlmin = require('gulp-htmlmin');
const less = require('gulp-less');
const cleanCSS = require('gulp-clean-css');
const babel = require('gulp-babel');
const terser = require('gulp-terser');
const inject = require('gulp-inject');

const browserSync = require('browser-sync').create();

// 构建HTML
function buildHtml() {
  return src('./index.html', { allowEmpty: true })
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest('dist'));
}


// 构建LESS
function buildLess() {
  return src('src/less/**/*.less', { allowEmpty: true })
    .pipe(less())
    .pipe(cleanCSS())
    .pipe(dest('dist/css'));
}


// 构建JS
function buildJs() {
  return src('src/**/*.js', { allowEmpty: true })
    .pipe(babel({presets:["@babel/preset-env"]}))
    .pipe(terser({
      mangle: {
        toplevel: true
      }
    }))
    .pipe(dest('dist'));
}

// 注入资源
function injectAssets() {
  const sources = src(['dist/css/**/*.css', 'dist/**/*.js'], { read: false, allowEmpty: true });
  return src('dist/**/*.html', { allowEmpty: true })
    .pipe(inject(sources, { ignorePath: 'dist', addRootSlash: false }))
    .pipe(dest('dist'));
}

function serve(cb) {
  browserSync.init({
    port: 8080,
    open: true,
    files: './dist/**',
    server: {
      baseDir: './dist'
    }
  });
  cb();
}

// watch使用
// function devWatch() {
//   watch('src/**/*.js', buildJs);
// }

// watch和server一起使用，作用和webpack开启本地服务器一样
function devWatch() {
  watch('./index.html', series(buildHtml, injectAssets));
  watch('src/less/**/*.less', series(buildLess, injectAssets));
  watch('src/**/*.js', series(buildJs, injectAssets));
}

// exports.html = buildHtml;
// exports.less = buildLess;
// exports.js = buildJs;
// exports.inject = injectAssets;
// exports.watch = devWatch;
exports.build = series(buildHtml, buildLess, buildJs, injectAssets);
// 或者
exports.build2 = series(parallel(buildHtml, buildLess, buildJs),injectAssets)

exports.devWatch = devWatch

exports.dev = series(exports.build, serve, devWatch);
