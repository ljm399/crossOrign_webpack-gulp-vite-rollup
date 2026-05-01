module.exports = function (content) {
  console.log('normal: hy_loader03 pre',content)
  return content
}

module.exports.pitch = function () {
  console.log('pitch: hy_loader03 pre')
  // return 'console.log("hy_loader03 pre")'
}
