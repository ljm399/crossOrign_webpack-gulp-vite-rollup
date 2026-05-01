# 标题

- 这是一个 md-loader 的测试
- 目标：把 markdown 渲染成 html 显示在页面

```js
console.log('md loader')
```

```js
// ./src/hy-loader/normal-loader.js
module.exports = function (content) {
  console.log('normal：hy_loader02', content)
  return `// banner from hy_loader02\n${content}`
}

module.exports.pitch = function () {
  console.log('pitch: hy_loader02')
}
```

```css
body {
  background-color: red;
}
```