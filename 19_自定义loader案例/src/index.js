const html = require('./learn.md')

require('./css/style.css')
require('highlight.js/styles/github-dark.css')

const app = document.createElement('div')
app.innerHTML = html
document.body.appendChild(app)