// 正确打印
console.log('你好')

// 无html，但也能让文字显示到网页方式一
// 1. 选择器举例（改选 body / 容器 / 标签）
const body = document.querySelector('body') 

// 2. 正确修改元素内容
body.innerHTML = '你好，mjlcode'

// 方式二
// 直接拿 body，最稳
const body2 = document.body

// 往页面写入文字
body2.innerHTML = '<h1>你好，mjlcode</h1>'