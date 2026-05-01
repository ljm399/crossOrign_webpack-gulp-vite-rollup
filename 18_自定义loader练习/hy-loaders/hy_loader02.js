module.exports = function (content) {
  console.log('hy_loader02', content)
  return `// banner from hy_loader02\n${content}`
}

module.exports.pitch = function () {
  console.log('pitch: hy_loader02')
}