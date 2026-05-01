const path = require('path')
const { validate } = require('schema-utils')

const schema = require(path.resolve(__dirname, './schema/loader06_schema.json'))

module.exports = function (content) {
  const options = this.getOptions() || {}
  validate(schema, options)

  const prefix = options.hyprefix ?? '// prefix from hy_loader06'
  console.log('hy_loader06', prefix, content)
  console.log('---------------')
  
  return `${prefix}\n${content}`
}
