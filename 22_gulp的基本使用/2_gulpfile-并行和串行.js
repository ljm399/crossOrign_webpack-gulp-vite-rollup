const { parallel, series } = require('gulp');

function js(cb) {
  setTimeout(() => {
    console.log(`[${Date.now()}] build js`);
    cb();
  }, 1000);
}

function css(cb) {
  setTimeout(() => {
    console.log(`[${Date.now()}] build css`);
    cb();
  }, 300);
}

// exports.build = parallel(js, css);
exports.build = series(js, css);