import { add } from './tree-utils'
import { acc } from './utils'
console.log('add:', add(1, 2))
console.log('acc:', acc)

const root = document.getElementById('root')
if (root) {
  const el = document.createElement('div')
  el.className = 'used'
  el.textContent = 'This element uses .used class'
  root.appendChild(el)
}
