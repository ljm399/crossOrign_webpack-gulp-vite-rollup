const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();

const TARGET = 'http://localhost:3000';

router.get('/api/ping', async (ctx) => {
  const res = await fetch(`${TARGET}/api/ping`);
  const data = await res.json();

  ctx.body = {
    ...data,
    via: 'proxy:4000',
    target: TARGET
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = 4000;
app.listen(port, () => {
  console.log(`[proxy] listening on http://localhost:${port}`);
  console.log(`[proxy] proxying to ${TARGET}`);
});
