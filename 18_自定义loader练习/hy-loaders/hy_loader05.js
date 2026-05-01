module.exports = function (content) {
  const options = this.getOptions() || {}
  const prefix = options.prefix ?? '// prefix from hy_loader05'
  console.log('hy_loader05',prefix, content);
  console.log('---------------');
  
  return `${prefix}\n${content}`
}
