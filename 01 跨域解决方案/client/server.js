const Koa = require('koa');
const serve = require('koa-static');
const path = require('path');

const app = new Koa();
const clientDir = path.resolve(__dirname);

// 拿到index.html
app.use(serve(clientDir));

const port = 5173;

// 访问的路径是localhost:5173,没有/。。这些了
app.listen(port, () => {
  console.log(`[client] listening on http://localhost:${port}`);
  console.log(`[client] open http://localhost:${port}/index.html`);
});
