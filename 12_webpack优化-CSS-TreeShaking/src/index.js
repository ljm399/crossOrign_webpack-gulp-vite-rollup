import './css/style.css'

const root = document.getElementById('root')
if (root) {
  const el = document.createElement('div')
  el.className = 'used'
  el.textContent = 'This element uses .used class'
  root.appendChild(el)
}

