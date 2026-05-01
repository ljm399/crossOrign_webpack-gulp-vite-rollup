const gulp = require('gulp');

function hello(cb) {
  console.log('hello');
  cb();
}

exports.hello = hello;// 或module.exports = { hello }
exports.default = hello;// 默认任务