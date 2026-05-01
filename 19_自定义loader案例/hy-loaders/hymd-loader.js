const { marked } = require('marked')
const hljs = require('highlight.js')

const renderer = new marked.Renderer()

renderer.code = function (tokenOrCode, infostring) {
  const code = typeof tokenOrCode === 'string' ? tokenOrCode : (tokenOrCode?.text ?? '')
  const lang = typeof tokenOrCode === 'string'
    ? (infostring || '').trim()
    : ((tokenOrCode?.lang || '').trim())

  const highlighted = lang && hljs.getLanguage(lang)
    ? hljs.highlight(code, { language: lang }).value
    : hljs.highlightAuto(code).value

  const safeLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  console.log(highlighted,'hightlisghte')
  console.log('---------------');
  
  return `<pre><code class="hljs language-${safeLang}">${highlighted}</code></pre>`
}

marked.setOptions({
  renderer
})

module.exports = function (content) {
  const html = marked.parse(content)
  console.log('html',html)
  console.log('----------------');
  
  return `module.exports = ${JSON.stringify(html)}`
}