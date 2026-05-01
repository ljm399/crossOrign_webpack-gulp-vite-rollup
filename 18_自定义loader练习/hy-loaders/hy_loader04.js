module.exports = function (content) {
  const callback = this.async()

  setTimeout(() => {
    const result = `${content}\nconsole.log('async: hy_loader04')`
    console.log('async: hy_loader04', result,'------')
    callback(null, result)
  }, 1000)
}
