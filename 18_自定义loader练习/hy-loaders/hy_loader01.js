module.exports = function (content) {
  console.log('hy_loader01', content)
  return content.replace(/hello/g, 'hi')
}
