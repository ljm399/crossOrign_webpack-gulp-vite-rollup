const { src, dest } = require('gulp');

function copyAssets() {
  return src('src/**/*', { allowEmpty: true })
    .pipe(dest('dist'));
}

exports.copy = copyAssets;