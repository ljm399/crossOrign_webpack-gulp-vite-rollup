const koa = require('koa')
const koaRouter = require('koa-router')
const koaBodyparser = require('koa-bodyparser');
const testRouter = new koaRouter({prefix:'/test'})
const app = new koa()
testRouter.get('/', (ctx, next) => {
    console.log(ctx.headers); // 里面的  host: 'localhost:8000'
    
    ctx.body = {
        code:200,
        data:[
            {name:'cao',age:3},
            {name:'code',age:4},
            {name:'lml',age:33}
        ]
    }
})
app.use(testRouter.routes())
app.use(testRouter.allowedMethods())
app.use(koaBodyparser())

app.listen(8000, () => {
    console.log('server is running on port 8000')
})