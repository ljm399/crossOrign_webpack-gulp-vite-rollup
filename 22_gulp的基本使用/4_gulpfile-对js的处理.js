const { src, dest, series } = require('gulp');
const babel = require('gulp-babel');
const terser = require('gulp-terser');

function buildJs() {
  return src('src/**/*.js', { allowEmpty: true })
    .pipe(babel())
    .pipe(terser({
      mangle: {
        toplevel: true
      }
    }))
    .pipe(dest('dist'));
}

exports.build = buildJs;