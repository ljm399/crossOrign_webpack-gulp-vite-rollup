# 一。代码分包

- 可以提高首屏加载效率
  - 知识补充：ssr也可以可以提高首屏加载效率
    - 同时ssr可以seo优化
  - 减少用户看到白屏时间

## 1.1.多入口起点(少用)

- entry

  - ```js
    entry:{
    	index:'路径'，
    	main:'路径'
    }
    ```

- output

  ```js
  filename:'[name]-bundle.js'  --- 这段代码无论单或多入口都可以用
  ```
  
  - name自动找到入口文件



## 1.2.动态导入分包（使用最多）

- import（）语法   
  - 入口文件中（main.js)

```js
btn.onclick = () => {
	import('导入点击才加载的文件')  --实现懒加载
}
```

- 当btn触发，再去请求文件路径，不同于下面的prefetch
  
  - prefetch是首页加载时立刻加载然后放于缓存中
    - 当其他要用时，去缓存中拿
  
- 和路由懒加载的关系/区别

  - 相同点
    - 本质都是利用动态 `import()` 触发 **代码分包 + 按需加载**（webpack 会把被动态导入的模块单独打成一个或多个 chunk）
    
  - 不同点
    - 路由懒加载
      - 常见于 SPA（React Router / Vue Router）
      - 以“路由切换”为触发时机：进入某个页面时才加载该页面对应的模块
      
    - 普通动态导入，触发时机更自由：点击按钮、滚动到可视区、某个条件满足等
      
      
      
      

- 老版本是靠require.ensure(目前不推荐使用)
  - 这是 webpack 早期提供的“异步加载”写法，属于**非标准语法**，可读性与生态兼容性不如标准 `import()`
  - 目前更推荐使用 `import()`（标准、和 TS/ESM 生态更一致）
  - 示例

```js
// require.ensure 是 webpack 特有 API（非 ES 标准）
btn.onclick = () => {
  require.ensure([], (require) => {
    const mod = require('./xxx')
    mod.default && mod.default()
  }, 'xxx-chunk')
}
```

```js
// 推荐写法：标准动态 import
btn.onclick = async () => {
  const mod = await import('./xxx')
  mod.default && mod.default()
}
```



### 调用或使用加载包里面的方法或变量

- mod.default是啥
  - `import()` 返回的是一个“模块对象”（module namespace object），里面包含该模块的所有导出
  - 如果被导入的模块使用的是**默认导出**：`export default ...`，那默认导出会挂在 `default` 属性上，所以要用 `mod.default`
  - 如果是**命名导出**：`export const foo = ...` / `export function foo(){}`，那就用 `mod.foo`

```js
// ./xxx.js
export default function run() {}
export const foo = 1

// 调用方
const mod = await import('./xxx')
mod.default() // 默认导出，可以调用里面函数
console.log(mod.foo) // 命名导出，输出里面的值

或
import('xx').then(res=>{
    res.default()
})

// 或者解构写法
const { default: run, foo } = await import('./xxx')
run()
console.log(foo)
```



### 修改打包名 

- webpack.config.js(部分自定义，即打包后由文件名按路径决定)

  ```js
  output:{
  	....
  	chunkFlieName:'[name]-xxx'// 也可以是[name].xxxx
  }
  ```

- 完全自定义

  - 入口文件使用魔法注释

    ```js
    btn.onclick = () => {
    	import(/* webpackChunkName: "about" */'导入点击才加载的文件')  --实现懒加载
    }
    ```

    - 打包后文件名是about.bundle.js
    
    - 有bundle是因为webpage.config.js中
    
      ```js
          output: {
                  // 多入口起点: 修改2
              filename: '[name].bundle.js', 这一行影响
          },
      ```
    
    - 添加chunkFilename
    
      ```js
          output: {
                  // 多入口起点: 修改2
              filename: '[name].bundle.js',
      
              // 所有分包的名字
              chunkFilename: '[name].chunk.js',
          },
      ```
    
      - 则打包后文件名是about.chunk.js



### 报错1：使用魔法注释失败

#### 根因：babel.config.js 里写了 `modules: 'commonjs'`

这会让 Babel 把 ESM 模块语法转换成 CommonJS（`require/module.exports`）。在这种情况下，`import()` 很容易被处理得让 webpack **识别不到“这里要做 code splitting”**，于是就出现你现在的现象：

- 打包输出里只看到 `main.bundle.js`
- 看不到 `hy_main.chunk.js`
- 点击也“没效果”（因为根本没拆出 chunk）

#### 解决

```js
modules: false
```



### 报错2：odule parse failed: 'import' and 'export' 

根因：**webpack 在解析某份 JS 时把它当成“script（非 module）”** 来解析了，但代码里出现了 `import ...`（而且还是 Babel 因为 `useBuiltIns: 'usage'` 自动注入的 `core-js` `import`），所以直接炸。

- 解决：

```js
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                type: 'javascript/auto',-- 添加这样行
                exclude: /node_modules/,
        ]
```

#### 这行的作用

- 强制 webpack 用 “auto 模式”处理 JS：既能识别 CommonJS，也能识别 ESM
- 避免某些情况下把 loader 输出当成 script 解析，从而导致 `import` 报 `sourceType` 错





# 思想：理解知识点

## 例子比概念更让人理解

- 例子并非完全替代概念：入门靠例子理解，**进阶拔高、严谨推理、知识体系构建，最终还是要回归精准概念**；避免只记例子、忽略概念本质，导致无法灵活拓展知识。





## 1.3.自定义分包（SplitChunkPlugin）

### 对第三方包分包

```js
optimization: {
  splitChunks: {
    chunks: 'all',
  },
}
```

- async（默认值） --- 简单来说对应import()这种动态
  - 这里的 `async` 指的是 **异步 chunk**（**通常由 `import()` 这种“动态导入”生成的 chunk）**-- **这也是和上面的区别**
  - 它和 JS 语法里的 `async/await` 不是一回事
  - 效果：只对“按需加载的模块”做公共代码抽离（例如多个页面都动态 import 了同一个库，就会把公共部分再抽成一个 async 公共 chunk）
- all --- 对应文件开头import这种静态
  - `all` = 同时处理 **initial(入口同步 chunk)** + **async(动态导入 chunk)**
  - 你写 `import React from 'react'` / `import axios from 'axios'` 这种属于“同步 import”（会进入入口 initial chunk），但依然可以被 splitChunks 抽离到打包文件：名字由vendors开头： `vendors~xxx.js`
    - 这叫 **拆分 bundle / 抽离 vendor**，不代表“异步按需加载”
    - 这些 vendor chunk 通常仍然会在首屏被加载（只是从 main.js 拆出来，利于缓存）
- 执行打包命令
  - 多出 **vendors**-**node_modules**_react-dom_client_js-node_modules_react_jsx-runtime_js-node_modules_core--d054e6.bundle.js 这个打包文件
    - 文件名解释
      - **node_modules**_react-dom_client_js
      - node_modules_react_jsx-runtime_js
      - node_modules_core
      - 把_ 变/， 就发现是路径了

    - 后面还有d054e6这个hash 以及 文件为什么这么长
      - 用于避免重名、提升缓存友好性
        - 重名则会找不到对应文件，重新下载




### 完全自定义分包

#### 自定义分包 和 分包的名字

```js
    optimization: {
        splitChunks: {
            chunks: 'all',
            maxSize: 40000,
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    filename: '[id]_vendors.js'，
                    priority: -10,
                },
                utils: {  -- 
                    test: /utils/,
                    name: 'utils',
                    minChunks: 1,
                    enforce: true,
                    priority: 0,
                    filename: '[id]_utils.js'
                }
            }
        },
    },
```

- key比如vendors和utils的作用**和普通对象的 key 一样**：用来“起名字/当标识符”
  - 一般用来匹配 `node_modules` 里的第三方依赖（react、axios、lodash...），抽离成 vendor chunk，便于缓存
  - `test: /[\\/]node_modules[\\/]/` 表示路径中包含 `node_modules/` 或 `node_modules\` 的模块都会被命中

- 没起作用
  - 原因：**`splitChunks` 默认只会把“被复用的模块”（至少被引用 2 次）抽出来**。你现在的 utils/index.js 在 src/index.js 里引用了一次，所以 webpack 可能会觉得“没必要拆”，仍然留在 `main.bundle.js` 里
  - 解决
    - 加了 `enforce: true`：强制执行分组
    - 加了 `minChunks: 1`：引用 1 次也允许抽离
    - 加了 `name: 'utils'`：明确这个 chunk 的名字（更稳定）
    - 加了 `priority: 0`：优先级比 vendors 高（防止规则冲突时被别的组抢走）

- `[\\/]`作用：有无win和mac文件分隔符不同
  - `[\\/]` 是正则的“字符集合”，表示匹配一个字符：`\` 或 `/`，用于兼容 Windows 和 macOS/Linux 的路径分隔符
  - 多了一个\作用是转义



#### 通过分包大小分包

- 第三方库影响
  - 如axios、form-data等库的某些模块可能保持较大体积
  - webpack会尽量保持这些模块的完整性

```js
optimization: {
  splitChunks: {
    chunks: 'all',
  },
  maxSize: 30000,
  minSize: 20000, 最小分包，默认值是20kb
}
```

- maxSize和minSize会影响打包后有多少文件
  - `minSize` **越大**
    - 越不容易拆分
    - **文件数量通常更少**
  - `minSize` **越小**
    - 更容易拆分出小 chunk
    - **文件数量可能更多**



### minimizr插件

- 是什么
  - webpack 的压缩入口叫 `optimization.minimizer`
  - 作用：对构建产物做“最小化”（minify），常见包含
    - JS 压缩（删除空格、改写变量名、去掉无用代码等）
    - CSS 压缩

- new TerserPlugin() / new CssMinimizerPlugin() 作用
  - `new TerserPlugin()`
    - JS 压缩器：压缩 JS、做 tree-shaking 后的“无用代码移除”、混淆变量名等
  - `new CssMinimizerPlugin()`
    - CSS 压缩器：压缩 CSS（去空格/注释、合并规则等）

- 和 mode 的关系
  - `mode: 'production'`
    - **默认会启用压缩**（`optimization.minimize: true`）
    - 默认 JS 压缩器通常是 `TerserPlugin`
  - `mode: 'development'`
    - **默认不压缩**（构建更快，便于调试）
  - 安装
    - `npm i -D terser-webpack-plugin css-minimizer-webpack-plugin`

```js
// webpack.config.js（示例：自定义 minimizer）
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
  },
}
```

- 常见注意点：当在保留 webpack 默认 minimizer 的同时外部又导入minimizer
  - **minimizer 一旦你手动写了，就会覆盖 webpack 的默认 minimizer 列表**
  - 所以：如果你的目标是“保留默认 JS 压缩（Terser） + 再加一个 CSS 压缩”，就需要在 `minimizer` 里写 `'...'`
    - `'...'` 是 **webpack5 提供的占位符字符串**，表示“把默认的 minimizers 也保留/带上”

```js
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = {
  optimization: {
    minimizer: [
      '...',
      new CssMinimizerPlugin(),
    ],
  },
}
```





#### 作用：

- production 构建出来的 js/css 体积更小
- 变量名可能被改写（这就是压缩/混淆的一部分），所以开发环境不建议开



#### 问题：为什么打包文件还有txt文件

- 因为你启用了 `minimize: true` + `TerserPlugin`，它默认会把第三方库里的 **license 注释**（例如 `/*! ... */`）提取到一个单独的文件里，常见名字是：

  - `xxx.js.LICENSE.txt`

  这是 **正常行为**，目的：
  - **保留开源协议声明**
  - 同时让主 `js` 更干净、更小

  ##### 我已帮你关掉这个行为（避免生成 `.LICENSE.txt`）
  在你的 [webpack.config.js](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/05_webpack%E5%88%86%E5%8C%85/webpack.config.js:0:0-0:0) 里把 `TerserPlugin` 改成：

  ```js
  new TerserPlugin({
    extractComments: false,
  })
  ```

  这样就不会再额外输出 `LICENSE.txt` 文件了（license 注释要么被保留在 bundle 里，要么被你其它选项控制）。

  我也顺手把 `new CssMinimizerPlugin` 改成了规范写法 `new CssMinimizerPlugin()`。




## 1.4.chunkId名称

- chunkId
  - named
  - natural
  - deterministic

- chunkId算法配置

```js
// webpack.config.js
module.exports = {
  optimization: {
    chunkIds: 'deterministic',
  },
}
```

- 三种常见值
  - natural
    - 按数字顺序生成 id（webpack4 常见默认）
    - 下面两个值webpack4之前是没有的
  - named
    - 生成可读名称，开发环境常用（便于调试）
  - deterministic
    - 生成“确定性的短数字 id”（webpack5 常见默认，缓存更友好）
- deterministic（为什么生产环境推荐，开发环境也是可以用的）
  - 相同模块在不同编译中尽量保持相同 id
    - 例如某个 utils chunk 经常能稳定成同一个 id（如 `497_utils.js`）
  - 不太受其他模块增减影响
    - 避免“只改了 A，却导致 B 的文件名/hash 也变了”的连锁反应
  - 对浏览器缓存更友好
    - 文件名/内容更稳定 => 缓存命中率更高 => 加载性能更好
- natural模式缺陷（打包性能/缓存问题）
  - id 按自然数顺序分配（0,1,2...）
  - 新增/删除模块容易导致已有模块 id 变化
  - 结果
    - 依赖这些 id 的 chunk 文件名/hash 跟着变化
      - **不必要的 id 变化**让很多产物的文件名/hash 跟着变，从而造成“连锁变化”
    - 浏览器缓存容易失效，用户需要重新下载更多资源
- 配置建议
  - 开发环境：`chunkIds: 'named'`（好调试）
    - 好调试原因它让 **chunk 的名字更“可读”**，你在浏览器/报错信息/Network 里更容易定位“这段代码来自哪里”
  - 生产环境：`chunkIds: 'deterministic'`（缓存友好）

```js
// 常见：按环境区分（示例）
module.exports = (env, argv) => ({
  optimization: {
    chunkIds: argv.mode === 'development' ? 'named' : 'deterministic',
  },
})
```



## 1.5.runtime的分包

- runtime 是什么
  - runtime chunk 里放的是 webpack 的“运行时代码/引导代码”（bootstrap）
    - **负责模块加载、chunk 加载、缓存、以及“这个 chunk 对应哪些模块 id”的映射等**
      - 如同package.lock.json文件一样
  - 当你的业务代码或分包策略变化时，runtime 里的映射信息也容易变化
  
- 为什么要单独分包 runtime
  - 如果 runtime 和业务代码/第三方库打在一起
    - runtime 一变，会连带让 `main.js`/`vendors.js` 的 hash 变化
    - 浏览器缓存更容易失效
  - 把 runtime 单独抽离
    - runtime 变化只影响 runtime 文件
    - `vendors` 等 chunk 更稳定，缓存命中率更高

```js
// webpack.config.js（示例：抽离 runtime）
module.exports = {
  optimization: {
    runtimeChunk: 'single',
  },
}
```

- runtimeChunk 常见取值
  - **single**
    
    - 全站共用一个 runtime（最常见）
  -  **true**
    
    - 多入口时给每个入口生成各自的 runtime
  -  **{ name: 'runtime' }**
    
    - ```js
          optimization: {
      	    // runtimeChunk: true,
              runtimeChunk: { name: 'runtimetttttt' },
      ```
    
    - 结果：runtimetttttt.bundle.js
    
    - 自定义 runtime chunk 名称
  
- 你会看到的效果（理解）
  - 产物会多一个 runtime 文件（例如 `runtime~main.js` 或 `runtime.js`）
  - 业务入口 chunk（main）和第三方 chunk（vendors）更容易保持稳定

- 配置建议
  - 单页应用/多页应用都常用：`runtimeChunk: 'single'`
  - 配合 `splitChunks` 一起使用效果最好（vendor 更稳定 + runtime 单独变化）



## 1.6.prefetch/preload

- 在具体文件中（和上面的动态导入的魔法注释相同），而不是webpack.config.js

- prefetch（最常用

  ```js
  btn.onclick = () => {
  	import(
          /* webpackChunkName: "about" */
          /* webpackPrefetch: true */
          '导入点击才加载的文件路径')  --实现懒加载
  }
  ```

  - 和动态导入区别
    - prefetch是当要加载的文件都加载完后立刻加载
      - 加载完后存放到缓存中
      - 要是你如同上面一样触发了动态导入按钮，那不会再次导入刚刚所需文件，而是在缓存中拿到刚刚已经加载完的文件
    - 动态导入时只有你出发某个事件才导入

- preload

  ```js
  btn.onclick = () => {
    import(
      /* webpackChunkName: "about" */
      /* webpackPreload: true */
      '导入点击才加载的文件路径')
  }
  ```

  - 和prefetch区别
    - preload（更“着急”）
      - 以更高优先级预加载资源（更接近“马上就要用”）
      - 可能会占用当前页面的带宽，过量使用会影响首屏
    - prefetch（更“佛系”）
      - 浏览器空闲时、低优先级地预取（更接近“以后可能会用”）
      - 对当前首屏影响相对更小
      - 测试，你f12-》控制台-》network-》发现对应文件最后才请求
        - 而preload则是在前面
  - 应用场景
    - preload
      - 下一个时刻几乎必用的 chunk
        - 例如：首屏渲染完立刻要展示的弹窗模块
        - 或者：进入某路由前就能确定“下一步必跳转”的页面模块
      - 关键资源需要更早到位（避免用户一触发就等待网络）
    - 注意
      - 不要对大量 chunk 都 preload，否则会导致网络拥塞，反而变慢
      
      

## 1.7.CDN服务器配置

- 解释：content deliver network
  - 让用户从离其最近的服务器拿资源
- 和服务器的区别
  - 服务器（源站 / origin）
    - 放你的业务服务
      - 动态接口（登录、下单、获取数据）
      - 服务端渲染/接口计算
    - 数据是“实时的/会变的”，通常不适合被大量缓存
  - CDN
    - 更适合放“静态资源”
      - js/css/png/font 等
      - 说明：源站也可以放静态资源；只是 CDN 在“就近分发 + 缓存 + 抗并发/省带宽”上更有优势
    - 通过**边缘节点缓存**来加速
      - 用户先从就近节点拿
      - CDN 没缓存/缓存过期时会“回源”（到源站拉取）
    - 好处
      - 降低延迟（离用户近）
      - 抗并发、节省源站带宽（大量静态请求被 CDN 吃掉）
  - 更新与缓存
    - 上 CDN 后要考虑缓存失效
      - 常见做法：文件名带 hash（例如 `app.8c2f.js`），内容变 => 文件名变 => 自动绕过旧缓存

### 方案一：所有资源都放到CDN中

- ```js
  webpack.config.js
  
  output:{
  	....
  	publicPath:'cdn地址'
  }
  
  --- 打包后原代码只有a的会多出cdn地址
  index.html
  <script defer="defer" src="cdn地址/a">
  ```

### 方案二：第三库放到CDN中，自己去找已有的cdn库

- 本地资源还是在直接的服务器中
- 使用
  - 先去搜索第三方库的cnd地址比如react，axios
  - 然后


  ```js
  webpack.config.js
  
  externals：{
      react："React",
      axios:"axios"
  }
  
  -----------
  在源文件的index.html 不是打包后的 添加
  <script src="对应的cdn文件路径"
  ```

  - key指的是 对应文件中 import A from B的 B
    - 即排除框架的名称
  - value指的是 对应文件中 A.get('url') 的 A
    - 从CDN请求下来的js中提供对应的名称

  ### 方案二报错（react is not defined）

- 原因
    - **CDN 链接指向了错误的构建格式（CJS/ESM），而不是给浏览器直接用的 UMD**
      - 现象
        - `Uncaught ReferenceError: exports is not defined`
        - `Uncaught ReferenceError: require is not defined`
      - 原因：你引的是 `cjs/xxx.js`（CommonJS）文件，它需要 `exports/require`，浏览器没有。

- 解决办法
    - 代码
      - **步骤 1：确认 CDN 文件存在（最稳）**
        
        - 看是否node_modules中的react是否有相关有 `umd/`
        - 没有就安装其他版本
        
      - **步骤 2：webpack externals（推荐最小集合）**
      
        ```js
        // webpack.config.js
        externals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        }
        ```
        
      - **步骤 3：HTML 引入 UMD（开发环境示例）**
      
        ```html
        <!-- index.html（源文件，不是 dist 里的） -->
        <script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.development.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.development.js"></script>
        ```
      
      - **步骤 4：externals中对照 key/value 关系（避免写错）**
        
        - `import React from 'react'` -> externals 的 key 是 `react`，value 是 `React`
        - `import { createRoot } from 'react-dom/client'` -> key 是 `react-dom/client`，value 是 `ReactDOM`



### 解释UMD

##### UMD 是什么

**UMD（Universal Module Definition）**是一种“**可以在多种环境下都能运行**”的 JavaScript 打包格式/封装方式。

同一份库代码，UMD 通常能在下面几种环境里工作：

- **浏览器直接用 `<script>` 引入**  
  - 它会把库挂到全局变量上，例如：
    - `window.React`
    - `window.ReactDOM`
- **AMD（RequireJS）环境**
- **CommonJS（Node.js）环境**（有的 UMD 也会兼容）

所以你常看到 React 的“浏览器可直接用”的包叫：

- `umd/react.development.js`
- `umd/react.production.min.js`

##### 为什么“外链（CDN）+ externals”基本必须要 UMD

你在 webpack 里写了：

```js
externals: {
  react: 'React'
}
```

这句话的含义是：

- 你的业务代码里 `import React from 'react'` **不要打进 bundle**
- 运行时去找一个 **全局变量**：`React`

也就是说，webpack 会生成类似这样的访问：

```js
var React = window.React; // 或直接用全局 React
```

那么问题来了：**谁来提供 `window.React`？**

- 如果你在 HTML 里用 `<script src="...">` 引入 React，那么这个脚本必须在浏览器里执行后，把 `React` 放到全局。  
- **UMD 版本的 React 就是专门干这个的**：加载后创建 `window.React`。
- 反过来，如果你引的是 **CJS**（CommonJS）文件（例如 `cjs/react.production.min.js`），它内部是 `exports` / `require` 体系：
  - 浏览器没有 `exports`、`require`
  - 所以就会出现你看到的：
    - `exports is not defined`
    - `require is not defined`

结论：  
**不是“任何时候都必须 UMD”，而是当你想在浏览器里用 `<script>` 直接引库，并且让它提供全局变量时，就需要 UMD（或同类的“浏览器全局包”）。**

##### 那为什么 React 19 这事儿会坑你

你现在 `react@19.2.5` 在 jsDelivr 的目录里显示 **没有 `umd/`**（只有 `cjs/`、`jsx-runtime.js` 等）。  
这意味着：你很难再用“老式的 `<script>` + `window.React`”这条路，至少不能靠 `umd/react.production.min.js` 这种文件名了。

##### 你有哪些替代方案（不靠 UMD 也能用 React）

- **方案 1：不使用 externals，让 webpack 把 React 打进包里**  （也就是方案一）
  - 最稳、最符合现代工程化
- **方案 2：用支持 ESM 的 CDN（`type="module"`）加载 React**  
  - 这时不是 `window.React`，而是 ES module import（通常 externals 的写法也要变）
  - 比较进阶





## *webpack 的缓存优化核心*

- **让产物文件名与内容强绑定**（常用 `[contenthash]`），并通过 **拆分 vendor/runtime + deterministic ids** 降低“无关变更导致的 hash 变化”。这样当业务只改了一小部分时，浏览器能继续命中未变化资源的缓存，只下载变化的那一部分，从而提升性能。



## 概念考察：里面的[id]和[name]是什么

在 webpack 的命名模板里，`[name]`、`[id]` 都是“占位符”，会被 webpack 在输出文件名时替换成真实值。

### `[name]` 是什么？
- **含义**：chunk 的“名字”
- **来源**：
  - 入口 chunk：来自 `entry` 的 key
    - `entry: { main: '...', index: '...' }` -> `[name]` 就是 `main` / `index`
  - 动态导入 chunk：来自魔法注释 `webpackChunkName`
    - `/* webpackChunkName: "hy_main" */` -> `[name]` 就是 `hy_main`
  - splitChunks 抽出来的 chunk：可能是 webpack 自动生成的名字（或者你在 `cacheGroups` 里写了 `name: 'utils'` 这种）

### `[id]` 是什么？
- **含义**：chunk 的数字 id（内部编号）
- **特点**：
  - 通常是数字（例如 `871`、`497`）
  - **不一定稳定**（尤其在 `chunkIds: 'natural'` 时，模块增减可能导致 id 变化）
  - `chunkIds: 'deterministic'` 会更稳定、更缓存友好

### 使用建议
- 想要**可读稳定**：优先用 `[name]`
- 想要**不冲突**但可读性差：用 `[id]`
- 真正生产更常见还会用 `[contenthash]` 来做强缓存（内容变才变名）





## 问题：<script src="./view1.jpg" 图片没找到

#### 前面可以找到因为之前是webpack服务器使用，不需要打包

```js
    devServer:{
    	static:['public','content'] // 默认值时public
    }
```

- 它只对 **devServer 启动后的 HTTP 访问**有效
- 对 **build 输出的 dist + file:// 打开**无效



#### 解决

##### 方案 A（最推荐、最 webpack 化）：把图片当模块导入
1. 把 `view1.jpg` 放到 `src/` 里（例如 `src/assets/view1.jpg`）
2. 在 [src/index.js](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/05_webpack%E5%88%86%E5%8C%85/src/index.js:0:0-0:0) 里 import 它，再设置到 DOM

并且 webpack5 需要一条资源规则（asset modules）：

```js
module: {
  rules: [
    { test: /\.(png|jpe?g|gif|svg)$/i, type: 'asset/resource' },
    // 你原来的 babel-loader rule...
  ]
}

--- index.html
<div id="img"></div>

-- index.js
// img
const imgContainer = document.getElementById('img');
if (imgContainer) {
    const img = document.createElement('img');
    img.src = view1;
    img.alt = 'view1';
    imgContainer.appendChild(img);
}

```

##### 方案 B（简单粗暴）
##### 1) 安装
在 `05_webpack分包` 目录下执行：

```bash
npm i -D copy-webpack-plugin
```

##### 2) 配置 [webpack.config.js](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/05_webpack%E5%88%86%E5%8C%85/webpack.config.js:0:0-0:0)
在文件顶部加一行引入：

```js
const CopyWebpackPlugin = require('copy-webpack-plugin')
```

然后在 `plugins` 里加上（和 `HtmlWebpackPlugin` 同级）：

```js
plugins: [
  new HtmlWebpackPlugin({
    template: './index.html'
  }),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'public/view1.jpg'),
        to: path.resolve(__dirname, 'dist/view1.jpg'),
      },
    ],
  }),
]
```

##### 3) HTML 里怎么写
这样打包后会有 `dist/view1.jpg`，所以 [index.html](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/05_webpack%E5%88%86%E5%8C%85/index.html:0:0-0:0) 里直接写：

```html
<img src="./view1.jpg" />
```

##### 4) 运行验证
```bash
npm run webpack
```



## 文件起名格式建议

```js
        filename: 'js/[name].bundle.js', -- 主文件就用.bundle来区分
        // 分包的名字
        chunkFilename: 'js/[name].chunk.js',-- 分文件就用chunk
```



## vendor为什么webpack.config.js总用这个当变量名

## 一句话核心答案

**`vendor` 不是关键字，只是行业通用的 “约定俗成” 名字**

意思是：**第三方依赖包**（比如 vue、react、axios、lodash、element-ui 等）

------

## 1. 单词含义

**vendor**

直译：**供应商、第三方**

在前端里 = **不是你写的代码，是别人写的库 / 框架 / 插件**

------

## 2. 为什么要把第三方代码单独打包？

因为：

- **你的代码**经常改
- **第三方库**几乎不改

如果不分开打包：

每次改一行业务代码 → 整个大 JS 文件重新下载 → 慢！

分开打包：

- `app.js`：你的代码（经常变）
- `vendor.js`：第三方库（几乎不变，能被浏览器**永久缓存**）

👉 **打包速度更快、网页加载更快**

#### 超简总结

**vendor = 第三方依赖包 = node_modules 里的代码**

webpack 用它做**代码分割 + 浏览器缓存优化**。

不是魔法，只是**行业习惯命名**。





# 二。其他优化

## 2.1.**`shimming`**(了解有这个解决方式就行)

#### 不推荐使用

- **不符合模块化封闭性**

- webpack 模块化核心思想：**模块完全隔离、依赖全部显式导入（import）、不依赖隐式全局变量、无隐藏依赖**。

- 而 shimming 是**全局隐式注入变量**，模块不需要 import 就能直接使用依赖，破坏了模块边界、作用域封闭，代码依赖不透明。

#### 典型场景

- 业务代码里直接使用 `$` / `_` / `axios` 等标识符，但不想在每个文件里手动 `import`
- 某些老库/老写法在模块里直接引用 `$` / `jQuery` 等标识符（在 webpack 的模块化环境里默认并不存在）
- 这类问题可以用 **`shimming`** 思路里的 `ProvidePlugin` 来“自动注入依赖”

- 垫片：ProvidePlugin 

  - 行为说明（重要）
    - `ProvidePlugin` 只对 **被 webpack 打包处理到的模块** 生效
    - 它并不会把变量真的挂到浏览器 `window` 上
    - 更准确的理解是：当某个模块里用到了某个标识符（比如 `axios`），webpack 会在该模块顶部**自动添加对应的 import**

  - webpack.config.js

    ```js
    plugins:[
     new ProvidePlugin({
     	 taxios: 'axios' ---当代码里用到 axios 标识符时，自动从 'axios' 模块引入
    	})
    ]
    ```

  - 测试途径

    - 直接设置一个第三方库，比如
    - utils/abc.js
    
    ```js
    axios.get('url').....  --- 这个axios不是靠import导入而是全局
    ```

#### 关于 `axios.default.get`

- 如果你做了上面的操作，但报错类似：`axios.get is not a function`（不是 `axios is not defined`）

  - 常见原因是 **ESM/CJS interop（默认导出兼容）** 导致你拿到的是“模块对象”，**真正的默认导出在 `default`** 上
  - 这不是一个必须出现的现象，取决于 axios 的构建产物与 webpack 解析方式

  - 临时验证（不推荐作为常规写法）

    ```js
    axios.default.get()
    ```

  - 推荐做法（让 `axios` 直接指向默认导出）

    ```js
    plugins:[
     new ProvidePlugin({
     		axios: ['axios','default'] ---当代码里用到 axios 标识符时，自动引入 
        })
    ]
    ```

##### 源码是

```js
原来是
export default axios；
改为
export {   
	axios as default； ---》所以拿axios的default才能拿到axios
}
```

- 注意export {} 的{}不是导出一个对象
  - 而是把当前文件强制标记为 ES Module 模块，获得独立模块作用域
  - **强制文件成为模块**





#### npm转pnpm问题

- 当你原来项目是 pnpm / npm，切换为npm/pnpm后，webpack 相关配置可能出现“同一份 `webpack.config.js` 突然报错/失效”
- 原因（常见）
  - **`node_modules` 结构不同**
    - npm：依赖通常是“扁平化”安装，路径更直观
    - pnpm：依赖安装在 `.pnpm/` 里，再通过**软链接（symlink）**映射到 `node_modules/`，目录结构更“深”
  - 这会影响一些“写死路径假设”的 webpack 配置，例如
    - `exclude: /node_modules/`、`include: path.resolve(...)` 这种规则：在不同的依赖结构下，可能导致某些依赖**被错误地排除/被错误地处理**
    - `resolve.symlinks`（webpack 默认会解析 symlink）：在 pnpm 的软链接结构下，模块真实路径/显示路径可能不一致，从而影响到 loader 命中、缓存 key、以及模块去重
  - 典型现象
    - loader 没有生效（例如 Babel/TS/JSX 没被转译）
    - 同一个包被当成“两个不同的包”导致冲突（例如 React 可能出现 hooks/重复副本类问题

#### 解决办法

- 使用npm/pnpm
- 看那个包引入不行，就用pnpm/npm专门下载
  - 比如原来是npm
    - 自己再pnpm add xx -D





## 2.2.CSS的提取

### 使用mini-css-extract-plugin

步骤

1. 安装
   - 
     ```bash
     pnpm i -D mini-css-extract-plugin style-loader css-loader
     ```
2. 导入
   - webpack.config.js
     
     ```js
     const MiniCssExtractPlugin = require('mini-css-extract-plugin')
     ```
3. 配置rule
   - webpack.config.js
     
     ```js
     module.exports = {
       module: {
         rules: [
           {
             test: /\.css$/,
             use: [
               // 开发环境常用 style-loader（CSS 注入到 <style>）
               // 生产环境用 MiniCssExtractPlugin.loader（抽离成单独 css 文件）
               MiniCssExtractPlugin.loader, 
               'css-loader', // 解析css
             ],
           },
         ],
       },
     }
     ```
   - `style-loader` vs `MiniCssExtractPlugin.loader`
     - `style-loader`：把 CSS 通过 JS 注入到页面（热更新体验更好），不会生成独立 css 文件
     - `MiniCssExtractPlugin.loader`：把 CSS 抽离成独立文件（利于缓存/并行加载），常用于生产环境
4. 配置plugins
   - webpack.config.js
     
     ```js
     module.exports = {
       plugins: [
         new MiniCssExtractPlugin({
           filename: 'css/[name].[contenthash].css',
           chunkFilename: 'css/[id].[contenthash].css',
         }),
       ],
     }
     ```
     
     - filename是打包主文件名
     - chunkFilename：是分包文件名

### 优化目录结构

```js
module.exports = {
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].[contenthash].css',
    }),
  ],
}
```

- 其他关于js的加上js/xxx

#### 效果

##### bundle打包目录

- js文件夹
  - js相关文件
- css文件夹
  - css相关文件
- index.html



#### 问题：打包后没有生产css文件夹

```
{
  test: /\.css$/,
  use: [
    isProd ? MiniCssExtractPlugin.loader : 'style-loader', // 👈 就是这里
    'css-loader',
  ],
}
```

- **开发环境（npm run dev /serve）**

  → 用 `style-loader`

  → **把 CSS 注入到页面 `<style>` 里**

  → **不会生成 .css 文件**

  

- **生产环境（npm run build）**

  → 才用 `MiniCssExtractPlugin.loader`

  → **才会抽离出单独的 CSS 文件**



## 2.3.Hash/ChunkHash/ContentHash

### 使用

- webpack.config.js（常见：JS/CSS/资源都带 hash）

```js
module.exports = {
  output: {
    filename: 'js/[name].[contenthash].js',
    chunkFilename: 'js/[name].[contenthash].chunk.js',
    assetModuleFilename: 'assets/[name].[contenthash][ext]',
    clean: true,
  },
}
```

- 如果你 CSS 用了 `mini-css-extract-plugin`，通常也会配成：

```js
new MiniCssExtractPlugin({
  filename: 'css/[name].[contenthash].css',
  chunkFilename: 'css/[id].[contenthash].css',
})
```

### 三者区别

- `[hash]`
  - 整个构建（一次 webpack build）的 hash
  - 特点：只要本次构建里任意一个文件内容变了，通常所有引用 `[hash]` 的输出文件名都会一起变
  - 常见问题：改了一个小模块，`main.js` 和 `vendor.js` 都可能一起换名，缓存命中率差

- `[chunkhash]`
  - 单个 chunk 的 hash（chunk 内容变化才变）
  - 特点：比 `[hash]` 更细粒度，理论上 chunk 不变就不换名
  - 常见注意点：如果把 runtime（webpack 引导代码）和业务 chunk 混在一起，runtime 的变化会“带着” chunkhash 一起变，所以经常配合 `optimization.runtimeChunk` 使用

- `[contenthash]`
  - 单个输出文件（asset）的内容 hash（文件内容变化才变）
  - 特点：粒度最细、最符合“内容变 => 名字变；内容不变 => 名字不变”
  - 实战最常用：JS/CSS/图片等静态资源一般优先用它



#### 注意测试chunkhash和contenthash不同不要使用动态导入即import()而是import""那些

- contenthash优点否则无效

### 什么时候决定用谁

- 开发环境（dev）
  - 一般不强调强缓存，更强调构建速度与调试体验
  - 常见用法：不加 hash 或者用 `[name].js`（配合 devServer/hmr）

- 生产环境（prod）
  - **首选 `[contenthash]`**（JS/CSS/资源）
  - 如果项目里历史原因只用到 `[chunkhash]`：也可以用，但要注意 runtime 影响，最好同时配置：

```js
optimization: {
  runtimeChunk: 'single',
}
```

- `[hash]`
  - 更适合“构建产物整体版本号”这类场景（例如某些极简 demo 或你确实想让所有文件一起换名）
  - 但不太适合做长期缓存优化



### 为什么使用contentHash有利于性能优化

- 浏览器强缓存的核心逻辑
  - 你往往会给静态资源（JS/CSS/图片）设置很长的缓存时间（例如 `Cache-Control: max-age=31536000, immutable`）
  - 这样用户二次访问时，浏览器会直接复用缓存，不用再下载

- 关键矛盾：缓存很久，但资源又会更新
  - 解决办法就是“文件名随内容变化”，也就是用 hash 命名
  - `contenthash` 做到：
    - 内容没变：文件名不变 => 浏览器继续命中缓存 => 访问更快、带宽更省
    - 内容变了：文件名变化 => 浏览器会当成新资源下载 => 不会拿到旧缓存导致页面错乱

  







## 2.4.DDL（了解以及更好的优化）

- 作用
  - DLL（通常指 webpack 的 `DllPlugin`/`DllReferencePlugin`）的核心目的：
    - 把**几乎不变的第三方依赖**（react/vue/lodash 等）提前单独打成一个包（dll bundle）
    - 业务代码构建时通过 manifest 做“引用”，减少重复编译第三方库，从而**提升二次构建速度**
  - 工作方式（理解）
    - 先跑一次“dll 构建”产出：
      - `vendor.dll.js`
      - `vendor-manifest.json`
    - 再在业务 webpack 配置里用 `DllReferencePlugin` 引用 manifest，让 webpack 认为这些模块已经存在，不再重复打包/编译
- 为什么 webpack4 之后（尤其 webpack5）不再推荐/逐渐淡出
  - 不是严格意义的“移除 API”（插件仍然存在），而是**官方不再推荐作为常规提速手段**，原因主要是：
    - webpack4/5 自己的增量构建与缓存能力更强（webpack5 还有 `cache: { type: 'filesystem' }`），很多场景不再需要 DLL 才能提速
    - 配置与维护成本高
      - 需要两套配置（dll 构建 + 业务构建）
      - 第三方依赖一升级，dll 就要重新打；忘了重打就容易出现“代码与 manifest 不一致”的问题
    - 容易引入“缓存/产物不一致”问题
      - dll bundle 的 hash/版本管理、与业务产物的 contenthash 配合、线上缓存失效策略都更复杂
    - 与现代工程特性配合一般
      - code splitting（动态 import）、按需加载、HMR、不同环境（dev/prod）构建差异下更容易踩坑

### 替代方案（更推荐

- 生产缓存优化：`splitChunks` + `runtimeChunk` + `[contenthash]` （上面有）
- 构建提速：webpack5 filesystem cache

  - 作用：把构建的中间结果缓存到**磁盘**，二次构建/重启 dev server 后也能复用，从而显著提升构建速度
  - 对比：内存缓存只在当前进程有效，dev server 一停就没了；filesystem cache 可以跨进程复用
  - 什么时候收益最大：项目越大、loader 越多、二次构建越频繁，提速越明显



### 构建速度代码和解释

```js
const path = require('path')

module.exports = {
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
    buildDependencies: {
      config: [__filename],
    },
  },
}
```

- 常用属性补充
  - `cacheDirectory`
    - 缓存落盘目录
    - 好处：方便你定位/清理缓存（构建异常时直接删这个目录即可重新生成）
  - `buildDependencies`
    - 指定“哪些文件变化会导致缓存失效”
    - `config: [__filename]` 表示 webpack 配置文件变化时，让缓存强制重新计算
    - 如果你把配置拆分成多个文件（例如 `webpack.common.js`），也建议把那些文件加进来
  - `name`
    - 缓存命名空间
    - 适合一个项目有多套构建配置时（例如 pc/mobile、不同 env），避免互相污染缓存
  - `version`
    - 手动指定缓存版本号
    - 当你做了较大调整，想“一刀切”让旧缓存全部失效时，可以改它
  - `compression`
    - 控制缓存是否压缩（压缩更省磁盘，但会增加一定的读写/压缩开销）

- 常见问题
  - 改了 webpack 配置但结果没变化
    - 优先检查 `buildDependencies` 是否覆盖到真实的配置来源
    - 或者直接删除 `cacheDirectory` 对应目录，让它重新生成缓存
  - 缓存目录变大
    - 属于正常现象，缓存是可删除的；空间不够时定期清理即可



#### config: [__filename]解释

##### 1.先拆单词

- __filename当前这个文件自己的完整路径也就是你写的这个 webpack.config.js

##### 2. 它的作用（核心！）

webpack 开启了 **filesystem 缓存（硬盘缓存）**

缓存能让打包速度变快，但会带来一个问题：

**如果你改了 webpack 配置，webpack 不知道，还继续用旧缓存 → 打包结果不对！**

**他的作用就是解决这个问题**

##### 3. 用大白话总结

```
config: [__filename]
```

= **告诉 webpack：配置文件变了，缓存就作废，重新打包！**

#####  4. 为什么必须写这个？

这是 **webpack 5 官方推荐的最佳实践**，不加会出现：

- 改了配置不生效
- 缓存不更新
- 打包结果异常

------

##### 5.超简记忆版

**`__filename` = webpack.config.js**

**`config: [__filename]` = 配置文件变了就刷新缓存**

------

##### 6.总结

- 这行是**webpack 5 缓存配置的标准写法**
- 作用：**监听配置文件变化 → 自动刷新缓存**
- 不用改，直接保留即可

