const Koa = require('koa');
const Router = require('koa-router');
const serve = require('koa-static');
const path = require('path');

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--mode=')) out.mode = arg.slice('--mode='.length);
    if (arg.startsWith('--port=')) out.port = Number(arg.slice('--port='.length));
  }
  return out;
}

function startApiServer({ port, enableCors }) {
  const app = new Koa();
  const router = new Router();

  
  if (enableCors) {
    app.use(async (ctx, next) => {
      const origin = ctx.get('Origin'); 
      const allowOrigin = origin || '*';

      ctx.set('Access-Control-Allow-Origin', allowOrigin);
      ctx.set('Vary', 'Origin');
      ctx.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      ctx.set('Access-Control-Max-Age', '600');

      if (ctx.method === 'OPTIONS') {
        ctx.status = 204;
        return;
      }

      await next();
    });
  }

  router.get('/api/ping', (ctx) => {
    ctx.body = {
      ok: true,
      message: 'pong',
      time: Date.now(),
      from: `api:${port}`
    };
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(port, () => {
    console.log(`[api] listening on http://localhost:${port} (cors=${enableCors})`);
  });
}

function startSameOriginServer({ port }) {
  const app = new Koa();
  const router = new Router();

  const clientDir = path.resolve(__dirname, '..', 'client');
  app.use(serve(clientDir));

  router.get('/api/ping', (ctx) => {
    ctx.body = {
      ok: true,
      message: 'pong',
      time: Date.now(),
      from: `same-origin:${port}`
    };
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(port, () => {
    console.log(`[same] listening on http://localhost:${port}`);
    console.log(`[same] open http://localhost:${port}/index.html`);
  });
}

const { mode = 'same', port } = parseArgs(process.argv);

if (mode === 'same') {
  startSameOriginServer({ port: port || 5000 });
} else if (mode === 'api') {
  startApiServer({ port: port || 3000, enableCors: false });
} else if (mode === 'api-cors') {
  startApiServer({ port: port || 3000, enableCors: true });
} else {
  console.error('Unknown mode. Use --mode=same | api | api-cors');
  process.exit(1);
}
