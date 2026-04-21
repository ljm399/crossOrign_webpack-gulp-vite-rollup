# 一。跨域问题和解决方案（这一步使用ai和自己一一练习）

## 1.1.跨域产生的原因

- 同源策略
- 早期得到服务器被渲染，没有跨域问题
- 前后端分离，所有才有跨域问题

### 1.1.1 什么是“同源策略”（Same-Origin Policy）

浏览器为了安全默认启用同源策略：页面里的脚本（JS）在发起网络请求并读取响应时，必须满足“同源”。同源的判断由三要素决定：

- 协议（http/https）
- 域名（localhost/127.0.0.1/a.com 等）
- 端口（3000/8080 等）

只要三者有任意一个不同，就属于“跨域”。

说明：跨域并不等于“请求发不出去”，而是“浏览器不允许 JS 读取到响应结果”（通常会在控制台看到 CORS 报错）。

### 1.1.2 为什么早期不容易遇到跨域

早期常见是服务端渲染（SSR）为主：

- 页面 HTML 和接口通常都由同一台服务、同一域名端口提供
- 浏览器访问到的资源天然同源，所以不会触发跨域限制

### 1.1.3 为什么前后端分离后跨域变多

前后端分离后，常见开发形态是：

- 前端开发服务器：例如 `http://localhost:5173`
- 后端 API 服务器：例如 `http://localhost:3000`

这时端口不同就已经跨域；如果再部署到不同域名/不同协议，也会跨域。

### 1.1.4 你需要能分清的 2 件事

- 浏览器同源策略限制的是：前端页面里的 JS（XHR/fetch）读取响应
- Postman/curl 等工具不受浏览器同源策略影响：
  - 也就意味着：用 Postman 看不到“浏览器跨域被拦截”的现象
  - 但可以用 Postman 验证服务端是否返回了正确的 CORS 响应头



## 1.2.放到同一个服务器没有跨域

核心思路：让“页面”和“接口”从浏览器视角看起来是同一个源（协议/域名/端口一致），就不会触发跨域。

常见做法：

- 做法 1：后端服务同时托管静态资源（把前端打包后的文件交给后端来 `static`）
- 做法 2：反向代理/网关统一入口（浏览器永远只访问 `https://www.xxx.com`，由网关把 `/api` 转发到后端）

### 1.2.1 练习目标

- 你能证明：当页面地址和接口地址同源时，不需要 CORS 也能正常请求

### 1.2.2 练习步骤（你之后写代码时按这个验证即可）

浏览器验证（推荐，用来看到“是否跨域”的真实效果）：

- 步骤 1：准备一个页面（例如 `client/index.html`）和一个接口（例如 `GET /api/ping`）
- 步骤 2：让同一个服务（同端口）既提供页面（即把静态资源部署到服务器），又提供 `/api/ping`
- 步骤 3：打开页面，用 `fetch('/api/ping')` 请求
- 预期：控制台无 CORS 报错，请求成功

Postman 验证（只能验证接口能不能通，无法体现跨域拦截）：

- 直接请求 `http://同一个端口/api/ping`
- 预期：返回成功（但这不能说明“没有跨域问题”，因为 Postman 本来就不拦，浏览器才会阻拦）

### 1.2.3 你要记录的结论

- “放到同一个服务器”本质不是物理机器相同，而是浏览器看到的 origin 相同
  - origin即你http://127.0.0.1:5500是什么，下面的问题和解决有解释

- 生产环境经常通过 Nginx/网关把前端与后端统一到同一域名下



### 问题与解决

#### 问题

- 问题1：用liver server（端口号是5500）打开,所以浏览器请求就是用5500端口去请求，这是fetch内部规定的吗

- 问题2：app.use(serve(clientDir)); 是什么意思

  ```
    const clientDir = path.resolve(__dirname, '..', 'client');
  ```

#### 解决

##### 1) 为什么会去请求 `http://127.0.0.1:5500/api/ping`？这是 `fetch` 内部写死的吗？

不是 `fetch` 写死的，是**你的代码写的相对路径**导致的：

在 [client/index.html](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/01%20%E8%B7%A8%E5%9F%9F%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88/client/index.html:0:0-0:0) 里我写的是：

- [request('/api/ping')](cci:1://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/01%20%E8%B7%A8%E5%9F%9F%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88/client/index.html:46:6-54:7)

这里的 `'/api/ping'` 是 **相对当前页面 origin 的“根路径”**。浏览器会自动把它拼成：

- `location.origin + '/api/ping'`

所以：

- 如果你页面是从 `http://127.0.0.1:5500/index.html` 打开的  
  => `location.origin` 就是 `http://127.0.0.1:5500`  
  => 请求就变成 `http://127.0.0.1:5500/api/ping`

- 如果你页面是从 `http://localhost:5000/index.html` 打开的  
  => 请求就是 `http://localhost:5000/api/ping`（这才是“同源请求”）

你之所以“没看到我写 5500”，是因为 **5500 来自你打开页面的方式（Live Server）**，不是我写在代码里的。

---

##### 2) `const clientDir = path.resolve(__dirname, '..', 'client'); app.use(serve(clientDir));` 是什么意思？

这一段是在 [src/index.js](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/01%20%E8%B7%A8%E5%9F%9F%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88/src/index.js:0:0-0:0) 的 [startSameOriginServer](cci:1://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/01%20%E8%B7%A8%E5%9F%9F%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88/src/index.js:55:0-78:1) 里，用来实现 **1.2 同源：同一个服务同时提供页面 + API**。

逐行解释：

###### `const clientDir = path.resolve(__dirname, '..', 'client');`

- `__dirname` 是当前文件所在目录（也就是 `.../01 跨域解决方案/src`）
- `path.resolve(__dirname, '..', 'client')` 表示：
  - 从 `src` 目录往上走一层到 `01 跨域解决方案`
  - 再进入 `client` 目录
- 最终得到一个绝对路径，指向：
  - `.../01 跨域解决方案/client`

###### `app.use(serve(clientDir));`
- `serve` 来自 `koa-static`
- 作用：把 `clientDir` 目录当成**静态资源目录**对外提供
- 结果就是：
  - 你访问 `http://localhost:5000/index.html`  
    实际返回的是 [client/index.html](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/01%20%E8%B7%A8%E5%9F%9F%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88/client/index.html:0:0-0:0)
  - 访问 `http://localhost:5000/...` 也能拿到 `client` 目录下的静态文件

然后同一个 Koa 服务里又定义了：
- `GET /api/ping`

所以你在 `http://localhost:5000/index.html` 页面里调用 `fetch('/api/ping')` 时：
- 页面和接口 **同源（都是 5000）**
- 就不会有跨域问题







## 1.3.服务器开启CORS

核心思路：既然前后端分离会跨域，那就由后端显式告诉浏览器“我允许你这个来源来访问”。这就是 CORS（Cross-Origin Resource Sharing）。

### 1.3.1 设置允许的CORS -- 本质你看浏览器缺啥，你服务器就补啥

```js
 app.use(async (ctx, next) => {
      const origin = ctx.get('Origin'); // 空的
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
```

#### 这段代码解决“跨域”的本质：**让浏览器愿意把响应交给前端 JS**

跨域拦截发生在浏览器端：当页面（比如 `http://localhost:5173`）用 `fetch` 请求另一个源（比如 `http://localhost:3000`）时，浏览器会检查 **服务端响应里有没有“允许跨域”的 CORS 响应头**。没有的话，浏览器会把响应“挡住”，前端 JS 读不到结果，于是你看到 CORS 报错。

你这段中间件做的事，就是给每个请求补齐这些 **CORS 响应头**（以及处理预检请求），从而让浏览器放行。

##### 1) `const origin = ctx.get('Origin');`
- 浏览器发起跨域请求时，会自动带一个请求头 `Origin`，值类似：
  - `http://localhost:5173`
- 你注释说“空的”，这通常有两种情况：
  - **同源请求**（可能不会带 Origin）
  - **Postman** 请求（Postman 也可能不带 Origin，除非你手动加）
- 但在“真正的浏览器跨域 fetch”里，`Origin` 基本都会有。

##### 2) `const allowOrigin = origin || '*';`
- 如果有 `Origin`，就“精确回显”这个 origin
- 如果没有，就用 `*`（表示允许任何来源）
- 为什么要这么做：
  - 浏览器要求 `Access-Control-Allow-Origin` 必须匹配当前页面的 origin（或者是 `*`），否则不放行

> 注意：如果你要 **携带 cookie（credentials）**，就不能用 `*`，必须返回具体的 origin。

##### 3) `ctx.set('Access-Control-Allow-Origin', allowOrigin);`
这是最关键的一句。

- 当浏览器看到响应头里有：
  - `Access-Control-Allow-Origin: http://localhost:5173`
- 它就会认为：服务端明确允许这个页面跨域读取响应
- 于是浏览器把响应结果交给 JS，`res.json()` 才能拿到数据

如果没有这个头：
- 请求可能已经到达服务端并返回了数据
- 但浏览器会拦截，前端拿不到结果，就报 CORS 错

##### 4) `ctx.set('Vary', 'Origin');`
这是**缓存相关**的正确做法。

- 你返回的是“不同 Origin 得到不同 Allow-Origin”的动态响应
- 如果中间有 CDN/代理缓存，可能会把 A 页面请求的响应缓存给 B 页面用
- `Vary: Origin` 告诉缓存：**按 Origin 区分缓存版本**，避免串缓存导致安全问题/错误放行

##### 5) `ctx.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');`
- 某些跨域请求在真正发出前，浏览器会先发一个 OPTIONS 来问： --- **注意是浏览器，你服务器满足他就行了**
  - “我能不能用 POST？”
  - “我能不能带某些头？”
- 服务端必须声明允许哪些方法，否则预检失败，请求不会继续。

##### 6) `ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');`
- 只要你跨域请求里带了某些“非简单请求头”，浏览器就会预检  --- **注意是浏览器，你服务器满足他就行了**
- 例如常见的：
  - `Content-Type: application/json`
  - `Authorization: Bearer xxx`
- 预检阶段浏览器会问：我能不能带这些头？
- 服务端必须在 `Access-Control-Allow-Headers` 里列出来，否则浏览器会拒绝继续发送真正请求。

> 你这里写死了两个 header；更通用的做法是回显 `ctx.get('Access-Control-Request-Headers')`，但你现在的练习版写死也能理解原理。

##### 7) `ctx.set('Access-Control-Max-Age', '600');`
还是预检相关：

- 预检通过后，浏览器会缓存这个“允许结果”一段时间（这里 600 秒）
- 好处：
  - 减少 OPTIONS 次数
  - 提升性能

##### 8) `if (ctx.method === 'OPTIONS') { ctx.status = 204; return; }`
这是**解决很多人“明明加了 CORS 还是不行”的关键**。

- 预检请求是 `OPTIONS`
- 如果你不专门处理它：
  - 可能路由没匹配，返回 404/405
  - 或者没返回允许头
- 浏览器一旦预检失败，就不会再发真正的 GET/POST
- 你在这里：
  - 直接返回 204（无内容，但成功）
  - 并且上面已经设置好 CORS 头
- 所以预检能顺利通过，跨域请求才能继续。 --- **注意是浏览器，你服务器满足他就行了**



#### 用一句话总结：为什么它能解决跨域？

- **跨域失败的原因**：浏览器不允许 JS 读取跨域响应（同源策略）
- **CORS 的解决办法**：服务端在响应里声明“我允许哪些 Origin/Methods/Headers”
- **这段代码的作用**：
  - 给响应加 `Access-Control-Allow-Origin`（放行读取）
  - 给预检加 Methods/Headers/Max-Age（放行预检）
  - 正确处理 OPTIONS（让预检不报错）

---



### 1.3.2 练习目标

- 你能从“浏览器跨域报错”（不同origin且未设置cors）过渡到“请求成功”（不同origin但设cors）
- Postman都可以，因为postman可以修改origin
  - 和浏览器对比，浏览器拿到{localhost：/index.html},然后浏览器里面某个时间出发来发送localhost：3000/api
  - 而postman直接localhost：3000/api，而不用在{localhost：/index.html}这里面发送
  - 问题：要是postman登录拿到token，那就不行了，因为权限不够而不是跨域问题






## 1.4.使用Node代理服务器（webpage）

- 伪代码

```js
......
const TARGET = 'http://localhost:3000';
router.get('/api/ping', async (ctx) => {
   // 让浏览器访问的是同源的url，但服务器这里直接改为http://localhost:3000这个别的非同元同源的
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
    // 服务器监听的是浏览器访问的
  console.log(`[proxy] listening on http://localhost:${port}`);
    
    // 但服务器后台把访问的url改为TARGET
  console.log(`[proxy] proxying to ${TARGET}`);
});

```

- 简述：

  - 让浏览器访问同源的url，服务器拿到这个url1，然后我服务器访问真正访问的url2，拿到对应的数据给浏览器返回就行了
    - 专业说法：**浏览器请求到了代理服务器的某个路由（url1），代理服务器在这个路由里再去请求 url2**。
  - 下面1.5本质也是这个

  



## 1.5. 配置Nginx反向代理 cors



## 3种方案的区别

#####  1) 1.4（Node 代理）和 1.5（Nginx 反代）属于同一类：**反向代理/网关方案**

- **url1**：代理层（Node 或 Nginx）暴露给浏览器的接口，比如：
  - `http://localhost:4000/api/ping`（proxy）
  - 或 `https://www.xxx.com/api/ping`（Nginx 统一入口）
- **url2**：真实 API，比如：
  - `http://localhost:3000/api/ping`

代理层做的就是“转发 + 返回”。

#####  2) 但它们不等同于 1.3（CORS）

- **1.4/1.5（反代）**：让浏览器请求变成**同源**，从根上绕开浏览器跨域限制
- **1.3（CORS）**：浏览器仍然跨域请求 url2，但后端通过响应头告诉浏览器“允许跨域读取”

换句话说：

- **反代方案**：浏览器根本不跨域
- **CORS 方案**：浏览器跨域，但被允许



## 1.6. 其他方案自行了解





# 二。webpack的基本回顾

- 使用npx webpack
  - 而不是直接webpack
    - 这会直接去全家里面找webpack
    - npx webpack则取node_modules里面找
    - 还有package.json的script不用加npx，因为它也会直接去node_modules里面找
      - srcipt：{ ‘webpack’：‘webpack’}   不用加npx

- 基于node

  - 所以要是使用commonjs

- npm init

- webpack.config.js

  - ```js
    const path = require('path');
    module.exports = {
        mode: 'none',
        entry: './src/index.js',
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'dist')
        }
    };
    ```

    - 作用

      - `entry`：打包入口（从这个文件开始分析依赖）
      - `output.path`：打包产物输出目录
      - `output.filename`：打包产物文件名（例如 `bundle.js`）

    - 注意

      - 打包成 `bundle.js` 只是“产物文件名变了/模块被打到一个文件里”，并不等于“隐藏源码”。
      - 浏览器里是否能看到源码、以及调试体验，主要取决于是否开启 `devtool`（是否生成 source-map）以及是否压缩（production 默认会压缩）。


  - mode

    - `none`
      - 不启用 `development`/`production` 的默认优化与默认配置（很多东西需要你手动配）

    - `development`
      - 偏向开发体验：构建更快、便于调试；通常不压缩，配合更友好的 source-map。

    - `production`（默认）
      - 偏向线上体积/性能：默认开启压缩（minimize）和多种优化（例如更激进的优化策略）。

    - development 和 production 常见差异点
      - 更常用的环境判断是 `process.env.NODE_ENV`（而不是 `process.config.mode`）。
      - 是否压缩、是否做优化（例如 tree-shaking 相关优化的默认策略）不同。





# 三。source-map

## 3.1.认识source-map的作用

- source-map是什么

  - 本质：一份“映射关系文件”，把“打包/压缩后的代码位置(行/列)”映射回“源代码位置”。
  - 目的：

    - 浏览器报错堆栈能定位到 `src/...`
    - 断点可以打在源文件上

- 没有 source-map 的痛点

  - 报错只指向 `dist/bundle.js`，行号对不上源码，难定位报错点。

- webpack 怎么开

  - 示例

    - ```js
      // webpack.config.js
      module.exports = {
        mode: 'development',//其他属性也可以
        devtool: 'source-map'
      };
      ```



## 3.2.source-map文件分析产物一般长这样

- - `dist/bundle.js`
  - `dist/bundle.js.map`
  
- 关联方式（当有多个source-map文件时，靠bundle.js末尾注释定位映射的source-map）

  - `bundle.js` 末尾会有：

    - ```js
      //# sourceMappingURL=bundle.js.map
      ```

  - DevTools 看到它，就会去加载 `.map` 文件。

- `.map`文件（即打包后的source-map文件）里常见字段（99%不会修改，所以了解就行））

  - `sources`：源文件路径列表
  - `sourcesContent`：源文件内容（有些模式会带）
  - `names`：变量/函数名映射相关
  - `mappings`：最核心的映射数据：使用 **Base64 VLQ + 差分编码**压缩存储，所以看起来像 `;AAAA;AACA...`。
  - sourceRoot：在控制台时source-map的上面文件下呢，没值就是根目录即sourceRoot下的文件

- 你在浏览器里能看到什么

  - f12 -> source 
  - 有两个文件，top和source-map，看报错问题和定位就在source-map看
  
  - 要是没有source-map，那就点击f12找到对应的js和css源代码映射
  
  

## 3.3.source-map常见值（知道eval和source-map就行）

- 设置不同值，目的为了性能优化
- 记忆思路

  - 精度：`cheap` 通常只到“行”，不含“列”
  - 速度：`eval` 通常更快（适合开发）
- 常见取值

  - `false`
    - 不生成 source-map
  - none 
    - 在production才生效，某个不被允许
  - `source-map` 
    - 推荐在production使用
    - 缺点
    - 独立 `.map` 文件
    - 优点：定位最准确（行/列级别）
    - 缺点：构建慢、map 大
  - elva
    - 在development使用
    - 优点
      - 构建速度快
      - 但定位不怎么准确

## 3.4.source-map不常见值（了解）

- `eval-source-map`

  - 没有source-map文件，source-map文件内容以eval函数合并到bundle.js文件里面
    - eval函数
  - 优点：速度快、定位也比较准确
  - 缺点：产物包含 `eval`，不适合生产

- `inline-source-map`

  - 和eval-source-map一样 直接内联到 `bundle.js`（base64）
  - 优点：不用额外请求 `.map`
  - 缺点：bundle 体积大

- `cheap-module-source-map`

  - 只能定位到第几行报错，而不能定位到第几个字符

    - 在控制台的source-map文件下看，而不是控制台，现在控制台只显示几行，第几个字符不显示了，但source-map显示

  - 特点：速度/精度平衡，能更友好地映射回经过 loader 处理前的源文件

  - 只适用于development

  - 示例

  - ```js
    module.exports = {
      mode: 'development',
      devtool: 'cheap-module-source-map'
    };
    ```

- `hidden-source-map`
  - 生成 `.map`，但 `bundle.js` 里不写 `sourceMappingURL`
    - 即默认不会引用map，是否引用看你自己
  - 常见用途：线上把 `.map` 上传到错误监控平台，但不让浏览器自动加载
  
- `nosources-source-map`
  - 有映射，但不包含 `sourcesContent`
  - 用途：让你定位到源文件的行号，但不把源码内容直接暴露出去
  
- 注意

  - “不暴露源码”不只看 `devtool`，还要看线上是否能访问到 `.map` 文件。



## 3.5.source-map最佳实践

- 开发（调试体验/速度）
  - `eval`

- 生产构建（需要还原问题）
  - `source-map`（准确但体积大）

- 真正线上发布（体积/安全）
  - `false`
  - 或 `hidden-source-map` / `nosources-source-map`（配合错误平台）

- 一个常见配置例子

  - ```js
    // webpack.config.js
    module.exports = (env, argv) => {
      const isProd = argv.mode === 'production';
      return {
        mode: isProd ? 'production' : 'development',
        devtool: isProd ? false : 'eval'
      };
    };
    ```



# 四。babel核心使用

## 4.1.babel的作用

- babel 是什么

  - JS 编译器：把“新语法/新特性代码”转换为“目标环境能运行的代码”。
    - 现在浏览器一般都支持es6，只是为了兼顾老浏览

- 主要解决两类兼容问题

  - 语法（syntax）
    - 例：箭头函数、class、可选链 `?.`、空值合并 `??`

  - API（polyfill）
    - 例：`Promise`、`Array.prototype.includes`
    - 这种不只是“语法转换”，需要 polyfill 方案（常用 `core-js`）

- 和 webpack 的分工

  - webpack：打包、处理模块依赖
  - babel：把代码转成“目标浏览器/Node”能跑的代码



## 4.2.babel命令行

### 4.2.1. babel安装

- npm i -D @babel/core @babel/cli
- npx babel
  - 因为要是babel -v 则去全局找
- 安装某个转换插件
  - npm i @babel/plugin-transform-arrow-functions

缺点：babel安装需要安装不同插件，然后才能转换的问题

解决：预处理



### 4.2.2.预处理

- plugin
- preset

- `plugin` vs `preset`

  - `plugin`：单个转换规则
  - `preset`：一组 plugin 的集合（最常用：`@babel/preset-env`）

- 命令行最小安装

  - ```bash
    npm i -D @babel/core @babel/cli @babel/preset-env
    ```

- 最小配置

  - `.babelrc`（或 `babel.config.json`）

    - ```json
      {
        "presets": [
          ["@babel/preset-env", { "targets": "> 0.25%, not dead" }]
        ]
      }
      ```

- 编译命令

  - ```bash
    npx babel src --out-dir lib
    ```

- 一个“转换前后”示例

  - `src/index.js`

    - ```js
      const add = (a, b) => a + b;
      ```

  - 输出（可能变成）

    - ```js
      "use strict";
      
      var add = function add(a, b) {
        return a + b;
      };
      ```



## 4.3.babel底层原理

- babel 核心：AST（抽象语法树）

  - parse：源码字符串 -> AST
  - transform：遍历 AST，应用 plugin/preset 做转换
  - generate：AST -> 新代码

- 最小示意（理解用）

  - ```js
    const { transformSync } = require('@babel/core');
    
    const { code } = transformSync('const add = (a,b)=>a+b', {
      presets: [['@babel/preset-env', { targets: 'defaults' }]]
    });
    
    console.log(code);
    ```

