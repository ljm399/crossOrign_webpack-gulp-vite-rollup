# 一。rollup工具的使用

### 先安装rollup

- pnpm i rollup -d

## 1.1.rollup的业务打包

### 打包css文件

- 安装（包括css的preset）
  - 命令
  
    ```bash
    pnpm add -D rollup-plugin-postcss postcss postcss-preset-env
    ```
  
    如果还需要处理 `less/sass`：
  
    ```bash
    pnpm add -D less sass
    ```
  - css的preset作用
  
    `postcss-preset-env` 是一组 **PostCSS 预设**，主要做两件事：
  
    - 让你可以写更“现代”的 CSS（未来语法/草案语法），再转换成目标浏览器能理解的 CSS
    - 自动加前缀（类似 Autoprefixer 的能力，通常结合 `browserslist` 配置决定兼容范围）
  
- 使用
  - 在 `rollup.config.js` 的 `plugins` 里加入 `postcss()`
  
    ```js
    const commonjs = require('@rollup/plugin-commonjs');
    const { nodeResolve } = require('@rollup/plugin-node-resolve');
    const postcss = require('rollup-plugin-postcss');
    const postcssPresetEnv = require('postcss-preset-env');
    
    module.exports = {
      input: './src/index.js',
      output: [
        {
          file: 'dist/index.iife.js',
          format: 'iife',
          name: 'MyLib',
          sourcemap: true
        }
      ],
      plugins: [
        nodeResolve(),
        commonjs(),
        postcss({
          extract: true,
          minimize: true,
          sourceMap: true,
          plugins: [
            postcssPresetEnv()
          ]
        })
      ]
    };
    ```
  
    说明：
  
    - `extract: true`：把 CSS 抽离成独立文件（默认会生成 `dist/index.css` 一类的文件）
    - `minimize: true`：压缩 CSS
    - `postcssPresetEnv()`：自动补前缀 + 现代 CSS 转换
    
  - css文件
  
    `src/index.css`
  
    ```css
    body {
      margin: 0;
      padding: 0;
    }
    
    .title {
      color: #333;
      user-select: none;
    }
    ```
  
    `src/index.js`（在入口里引入 css）
  
    ```js
    import './index.css';
    ```
    
    - 看效果
    
      ```html
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Rollup Business Bundle</title>
        <link rel="stylesheet" href="./dist/bundle.iife.css" /> 记得引入css而不单是js
      </head>
      <body>
        <div id="app"></div>
        <script src="./dist/bundle.iife.js"></script>
      </body>
      </html>
      ```
    
      - 为什么这里要引入css呢
        - 因为你这又不是html-webpack-plugins
        - index.js要引入css，是因为index.js是入口文件
    
  - 执行命令
  
    ```bash
    pnpm exec rollup -c
    ```



### 打包vue文件

- 安装

  - 命令

    ```bash
    pnpm add vue
    pnpm add -D rollup-plugin-vue @vue/compiler-sfc
    pnpm add -D @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-replace
    ```

- 使用

  - rollup.config.js

    ```js
    const commonjs = require('@rollup/plugin-commonjs');
    const { nodeResolve } = require('@rollup/plugin-node-resolve');
    const replace = require('@rollup/plugin-replace');
    const vue = require('rollup-plugin-vue');
    const postcss = require('rollup-plugin-postcss');
    const postcssPresetEnv = require('postcss-preset-env');
    const  terser  = require('@rollup/plugin-terser');
    
    const isProd = process.env.NODE_ENV === 'production';
    
    module.exports = {
      input: './src/index.js',
      output: {
        file: 'dist/bundle.iife.js',
        format: 'iife',
        name: 'App',
        sourcemap: !isProd
      },
      plugins: [
        replace({
          preventAssignment: true,
          'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development')
        }),
        vue({
          css: true,
          compileTemplate: true
        }),
    
        postcss({
          extract: true,
          minimize: isProd,
          sourceMap: !isProd,
          plugins: [
            postcssPresetEnv()
          ]
        }),
    
        nodeResolve({
          browser: true,
          extensions: ['.mjs', '.js', '.json', '.vue']
        }),
        commonjs(),
    
        isProd && terser()
      ].filter(Boolean)
    };
    
    ```
  
  - 解释相关代码
  
    - `output.name: 'App'`
  
      `iife/umd` 需要一个全局变量名（最终会挂在 `window.App`/`globalThis.App` 上）。
  
    - `@rollup/plugin-replace`
  
      把源码里的字符串替换掉。这里用来注入 `process.env.NODE_ENV`。
  
      Vue/部分依赖会根据 `process.env.NODE_ENV` 做 dev/prod 分支判断；不替换的话，浏览器环境下可能出现 `process is not defined` 或无法做正确的生产优化。
  
      `preventAssignment: true` 是该插件的必需安全选项（避免误替换赋值语句导致异常）。
  
    - `@rollup/plugin-node-resolve`
  
      让 Rollup 能按 Node 的规则从 `node_modules` 解析包的入口文件。
  
      `browser: true` 表示优先使用包里为浏览器准备的入口（例如优先读 `package.json` 的 `browser` 字段）。
  
    - `@rollup/plugin-commonjs`
  
      把 `node_modules` 里的 CommonJS 模块转换成 ES Module，Rollup 才能继续做依赖分析和打包。
  
    - `rollup-plugin-vue`
  
      让 Rollup 识别并编译 `.vue` 单文件组件：
  
      - `compileTemplate: true`：编译 `<template>`（依赖 `@vue/compiler-sfc`）
    - `css: true`：把 `<style>` 里的 CSS 提取/注入到产物里（具体行为取决于插件版本/配置；你也可以和上面打包 CSS 的 `postcss` 方案结合做抽离与压缩）
    - compileTemplate: true
    
      - **让 `rollup-plugin-vue` 在打包时把 `.vue` 里的 `<template>` 编译成 JS 渲染函数**（render function），这样最终输出的 bundle 里就不再需要在浏览器运行时去“现编译模板
  
- src/vue/App.vue
  
  ```vue
    <template>
    <div class="app">
        <h2 class="title">Hello Rollup + Vue</h2>
        <p class="desc">msg: {{ msg }}</p>
      <p>count: {{ count }}</p>
        <p>double: {{ doubleCount }}</p>
      <button @click="inc">+</button>
        <button @click="dec">-</button>
      </div>
    </template>
    
    <script>
    export default {
      props: {
        msg: {
          type: String,
          default: 'hi'
        }
      },
      data() {
        return {
          count: 0
        };
      },
      computed: {
        doubleCount() {
          return this.count * 2;
        }
      },
      watch: {
        count(newVal, oldVal) {
          if (newVal !== oldVal) {
            console.log('count changed:', oldVal, '->', newVal);
          }
        }
      },
      methods: {
        inc() {
          this.count += 1;
        },
        dec() {
          this.count -= 1;
        }
      },
      mounted() {
        console.log('App mounted');
      }
    };
    </script>
    
    <style scoped>
  </style>
  ```
  
  - index.js
  
    ```js
    import App from './vue/App.vue';
    createApp(App, { msg: 'Hello from Vue!' }).mount('#app');
  
  




## 1.2.开发服务器搭建

### 第一步：安装命令来搭建服务器

- 命令

  ```bash
  pnpm add -D rollup-plugin-serve rollup-plugin-livereload
  ```

### 第二步：当文件发送变化，自动更新浏览器

- 命令

  浏览器自动刷新依赖 `rollup-plugin-livereload`，它会监听你输出目录（例如 `dist`），当 `dist` 里的文件发生变化时，触发浏览器刷新。

### 第三步：启动时，开启文件监听

Rollup 自带 watch 模式，只要用 `-w/--watch` 启动即可。它会监听你的源码依赖（`src/**` 以及依赖图中的文件），变更后自动重新构建。

### 使用

- rollup.config.js（示例）

  ```js
  const serve = require('rollup-plugin-serve');
  const livereload = require('rollup-plugin-livereload');
  
      serve({
        open: true,
        contentBase: ['dist'],
        port: 8080
      }),
      livereload('dist')
    ]
  };
  ```
  
- contentBase解释

  - `contentBase` 用来指定“静态服务器要托管（serve）哪个目录/哪些目录”

    你可以把它理解成：本地起的这个 server 的根目录（静态资源从这里读取）。

    例如：

    - `contentBase: ['dist']`

      访问 `http://localhost:8080/` 时，会从 `dist/` 目录下找 `index.html`、`bundle.js` 等文件。

    - 如果你的 `index.html` 在项目根目录，而产物在 `dist/`，可以写成：

      - `contentBase: ['.', 'dist']`
        - 要是在./找不到，就去dist/找
  
  - 和 `livereload('dist')` 的关系
  
    - `contentBase` 决定“浏览器访问时静态文件从哪来”
    - `livereload('dist')` 决定“监听哪个目录，一变就刷新浏览器”
  
    常见做法是两者都指向 `dist`：构建输出到 `dist`，server 也托管 `dist`，livereload 也监听 `dist`。
  
  - 和 `open/port` 的关系
  
    - `open: true`：启动服务器后自动打开浏览器
    - `port: 8080`：服务器端口
  
- 启动命令

  ```bash
  pnpm exec rollup -c -w
  ```

## 1.3.开发环境和生产环境对代码解构

- 安装命令
  - pnpm add -D cross-env

- package.json修改

  ````json
  {
    "scripts": {
      "dev": "cross-env NODE_ENV=development rollup -c -w",
      "build": "cross-env NODE_ENV=production rollup -c"
    }
  }
  ````

- rollup.config.js的修改

  ```js
  const commonjs = require('@rollup/plugin-commonjs');
  const { nodeResolve } = require('@rollup/plugin-node-resolve');
  const replace = require('@rollup/plugin-replace');
  const vue = require('rollup-plugin-vue');
  const serve = require('rollup-plugin-serve');
  const livereload = require('rollup-plugin-livereload');
  const  terser  = require('@rollup/plugin-terser');
  
  const isProd = process.env.NODE_ENV === 'production';
  
  module.exports = {
    input: './src/index.js',
    output: {
      file: 'dist/bundle.js',
      format: 'iife',
      name: 'App',
      sourcemap: !isProd
    },
    plugins: [
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development')
      }),
      nodeResolve({ browser: true }),
      commonjs(),
      vue({ css: true, compileTemplate: true }),
      !isProd && serve({
        open: true,
        contentBase: ['dist'],
        port: 8080
      }),
      !isProd && livereload('dist'),
      isProd && terser()
    ].filter(Boolean)
  };
  ```

- 对rollup.config.js修改方式二

  ```js
  const isProd = process.env.NODE_ENV === 'production';
  const plugins = [
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      nodeResolve({
        browser: true
      }),
      commonjs(),
      vue({
        css: true,
        compileTemplate: true
      })
    ]
  const extraPlugins = [
      serve({
        open: true,
        contentBase: ['dist'],
        port: 8080
      }),
      livereload('dist'),
      terser()
  ]
  isProd ? plugins : plugin.push(...extralPlugins)
  module.exports = {
    input: './src/index.js',
    output: {
      file: 'dist/bundle.js',
      format: 'iife',
      name: 'App',
      sourcemap: true
    },
    plugins: plugins
  };
  ```



#### pnpm exec rollup -c 和pnpm run dev/build区别

#### `pnpm exec rollup -c`
这是**直接执行 rollup 这个命令**（从当前项目的 `node_modules/.bin` 里找可执行文件）：

- **执行的是谁**：`rollup`（CLI）
- **参数**：`-c` 表示读取 [rollup.config.js](cci:7://file:///c:/Users/MJL/Desktop/javascript/17_webpack-gulp-vite-rollup/crossOrign_webpack-gulp-vite-rollup/25_rollup-%E4%B8%9A%E5%8A%A1%E6%89%93%E5%8C%85/rollup.config.js:0:0-0:0)
- **是否 watch**：默认不 watch（除非你再加 `-w`）
- **是否设置环境变量**：不会自动设置 `NODE_ENV`（除非你自己在命令行前面设置）

你现在这个命令等价于“手动跑一次构建”：

```bash
pnpm exec rollup -c
```

#### `pnpm run dev` / `pnpm run build`
这是执行 [package.json](cci:7://file:///c:/Users/MJL/Desktop/javascript/17_webpack-gulp-vite-rollup/crossOrign_webpack-gulp-vite-rollup/25_rollup-%E4%B8%9A%E5%8A%A1%E6%89%93%E5%8C%85/package.json:0:0-0:0) 里你定义的 **scripts**（相当于起别名/工作流）：

- **执行的是谁**：`scripts.dev` 或 `scripts.build` 那串命令
- **你目前的 scripts**：

```json
"dev": "cross-env NODE_ENV=development rollup -c -w",
"build": "cross-env NODE_ENV=production rollup -c"
```

所以：

- `pnpm run dev`：
  - 会先用 `cross-env` 设置 `NODE_ENV=development`
  - 然后执行 `rollup -c -w`（**watch 模式**，文件变了会重新打包）
- `pnpm run build`：
  - 设置 `NODE_ENV=production`
  - 然后执行 `rollup -c`（构建一次，通常配合压缩/关 sourcemap）

#### 你的项目里这两类命令的“实际差异”
- **[是否统一入口]**  
  - `pnpm run dev/build`：统一从 scripts 入口启动（团队协作更规范）
  - `pnpm exec rollup ...`：更像临时手动跑命令
- **[环境变量]**  
  - `run dev/build`：你已经在脚本里控制 `NODE_ENV`（Windows 下用 `cross-env` 很关键）
  - `exec rollup -c`：不设置 `NODE_ENV`，[rollup.config.js](cci:7://file:///c:/Users/MJL/Desktop/javascript/17_webpack-gulp-vite-rollup/crossOrign_webpack-gulp-vite-rollup/25_rollup-%E4%B8%9A%E5%8A%A1%E6%89%93%E5%8C%85/rollup.config.js:0:0-0:0) 里 `isProd` 可能判断不对
- **[watch/开发体验]**  
  - `run dev`：包含 `-w`（适合开发）
  - `exec rollup -c`：一次性构建（适合检查输出）

#### 一句话结论
- **想“按项目约定的方式开发/打包”**：用 `pnpm run dev` / `pnpm run build`
- **想“临时手动跑 rollup”**：用 `pnpm exec rollup -c`（或加 `-w`）


# 二。vite工具的使用

## 2.1.vite的核心思想

vite 的核心思路可以概括为：

- **开发环境不打包**：利用浏览器原生 ES Module（ESM）能力，把“按需加载”交给浏览器；Vite 只做一个开发服务器，负责把源码以模块形式提供出来。
  - 即浏览器本身就支持Es module（自动加载es6以上的代码）

- **依赖预构建 + 缓存**：第三方依赖（通常在 `node_modules`）通过 esbuild 做一次预构建（把 CommonJS/UMD 转成 ESM、合并碎片、提速解析），并强缓存到本地，后续启动/刷新复用。
- **生产环境再打包**：真正的 bundle 工作交给 Rollup（Vite 的 build 基于 Rollup），面向上线做压缩、拆包、兼容处理等。

### 和webpack区别

#### 打包方式

- **webpack**
  - **开发/生产都以“打包”为中心**：不管 dev 还是 build，核心都是先把依赖图解析出来，再把模块打到一个或多个 bundle 里。
  - dev server 的 HMR 本质上也是建立在“构建产物”的基础上：文件改动后需要重新编译（至少是增量编译），再把更新推送到浏览器。

- **vite**
  - **开发环境以“原生 ESM + 按需编译”为中心**：
    - 首次访问页面时，只请求入口模块（例如 `main.js`）。
    - 浏览器在解析到 `import` 语句时，才会继续发起对依赖模块的请求。
    - Vite 在服务端对请求到的模块做“即时编译/转换”（例如把 TS/JSX/Vue SFC 转成浏览器能运行的 JS），并返回给浏览器。
  - **生产环境才打包**：`vite build` 走 Rollup，将模块打成最终可部署的资源。

#### 为什么vite速度快

- **[启动快]**
  - Vite dev 启动时不需要先把整个项目打包完，只需要启动一个 server + 做依赖预构建（且可缓存）。
  - webpack dev 往往需要先完成一次（或较大规模的）构建，项目越大启动越慢。

- **[更新快（HMR 快）]**
  - Vite 只需要精准地让“被改动的那个模块”失效并重新请求（模块粒度更细），通常不需要重建整个依赖图的打包产物。
  - webpack 在很多场景下需要重新走一次编译流程（即便是增量），大型项目依然会明显变慢。

- **[esbuild 加速依赖处理]**
  - Vite 的依赖预构建默认用 esbuild（Go 编写），对大量依赖的转换/解析非常快。
  - webpack 在 loader/插件链路上做转换更灵活，但转换成本通常更高。

- **[更少的无效工作]**
  - Vite dev 不需要为了“把所有模块塞进 bundle”而做大量额外的封装/拼接工作。
  - 只对“浏览器实际请求到的模块”做转换，这让开发阶段的成本更接近真实访问路径。

### 其他

- **[为什么生产还要打包]**
  - 生产环境仍然需要打包来实现：
    - 更好的缓存策略（文件名 hash）
    - 资源压缩与 tree-shaking
    - 代码分割（按路由/按页面拆包）
    - 兼容性处理（目标浏览器不完全支持某些语法/特性）
- **[Vite 不是“完全不打包”]**
  - 只是 **开发阶段尽量不做全量 bundle**，生产构建依旧是打包。





## 2.2.浏览器支持模块化

### 例子

- src/index.js

  ```js
  import { sum } from './utils/index.js';

  const appEl = document.querySelector('#app');
  const result = sum(10, 20);

  appEl.textContent = `10 + 20 = ${result}`;
  console.log('result:', result);
  ```

- src/utils/index.js

  ```js
  export function sum(a, b) {
    return a + b;
  }
  ```

- index.html 补充和完善

  ```html
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Browser ESM Demo</title>
    </head>
    <body>
      <div id="app"></div>
  
      <!--
        关键点：必须使用 type="module"
        浏览器才会把它当成 ES Module 来解析，从而支持 import/export
      -->
      <script type="module" src="./src/index.js"></script>
    </body>
  </html>
  ```

  - 注意点
    - 直接用浏览器打开本地 html（file 协议）时，模块请求可能会被浏览器限制；一般需要启动一个静态服务器（这也是 Vite dev server 存在的原因之一）



## 2.3.vite打包ts/css/less

## 底层原理

- 和前面 2.1 的核心思想一致：**开发环境不做全量打包**，而是**按需编译**。

  - 注意：这里的“按需”指的是 **按浏览器请求到的模块** 来转换/返回。
  - webpack 并不是“看到 import 就让浏览器去下载相关文件”。webpack 在开发时通常会先把模块构建成（一个或多个）bundle，再由 dev server 提供给浏览器。
  - Vite 的区别是：开发阶段尽量不提前打包成 bundle，而是把每个模块当成独立资源提供（浏览器解析到 `import` 才会继续发起请求）。

- 请求链路大致是：

  - 浏览器请求入口（`/src/main.ts` 或某个模块）
  - Vite dev server 拦截该请求，把源码转换为浏览器可执行的内容再返回
    - `connect/koa` 是 **Vite dev server** 的中间件框架选择（早期版本曾使用过 Koa），但这和 esbuild 是两件事
    - esbuild 是 **Go 编写的编译器/打包器**，Vite 在开发阶段大量用它做 TS/JSX 等的快速转换
  - 返回转换后的内容，并配合 HMR 做模块级更新

- css/less 也是类似：

  - css 作为模块被引入（`import './index.css'`）后由 Vite 处理并注入到页面
  - less/sass 会由对应预处理器把源码先编译成 css，再交给 Vite/PostCSS 继续处理（如加前缀），最后再注入页面

  

  

### vite打包ts

- 安装命令

  - 命令

    ```bash
    # 1. 创建项目（选择 vanilla + ts 或者你需要的框架 + ts）
    pnpm create vite
    
    # 2. 进入项目后安装依赖
    pnpm i
    ```

- 执行命令

  - 命令

    ```bash
    pnpm run dev
    ```

    如果想启动时自动打开浏览器：

    ```bash
    pnpm run dev -- --open
    ```

- ts代码例子

  - index/ts/index.ts

    ```ts
    export function sum(a: number, b: number) {
      return a + b;
    }
    
    const appEl = document.querySelector('#app');
    if (appEl) {
      appEl.textContent = `10 + 20 = ${sum(10, 20)}`;
    }
    ```

    

- 效果：自动打开浏览器，浏览器自动加载原本不能加载的ts

  - 你直接在浏览器里用 `<script src="xxx.ts">` 是跑不起来的（浏览器不认识 TypeScript 语法）。
  - 通过 Vite 启动 dev server 后，你访问的是 `http://localhost:xxxx`：
    - 浏览器请求到的其实是 **Vite 转换后的 JS**
      - 可以在浏览器控制台的网络请求获取相关文件的preview（请求的是ts文件，但preview是js），看到浏览器真正拿到的代码
    - 所以看起来像“浏览器能加载 ts”，本质是 **Vite 在服务端把 ts 即时编译成 js 再返回**

  

### vite处理less/potcss

- 安装命令

  - 命令

    ```bash
    # less 预处理器
    pnpm add -D less
    
    # postcss 相关（potcss 这里指的就是 postcss）
    pnpm add -D postcss autoprefixer
    ```

- 使用

  - src/style.less

    ```less
    @mainColor: #409eff;

    .title {
      color: @mainColor;
      user-select: none;
    }
    ```

  - 在入口里引入 less（例如 `src/main.ts` / `src/main.js`）

    ```ts
    import './style.less';
    ```

  - 使用potcss，要配置

    - 实际上一般叫 `postcss.config.js`（Vite 会自动识别）

      ```js
      module.exports = {
        plugins: [
          require('autoprefixer')
        ]
      };
      ```

- 执行命令

  - 命令

    ```bash
    pnpm run dev
    ```

#### potcss作用

- potcss 指的是 PostCSS：一个用 JS 处理 CSS 的工具链（基于插件）。
- 常见作用
  - 自动补齐浏览器前缀（`autoprefixer`）
  - 使用现代 css 语法并降级（`postcss-preset-env`）
  - 压缩（`cssnano`）
  - 配合设计规范做 lint/转换等





## 2.4.vite搭建vue/react项目





## 2.5.vite脚手架的使用





## 2.6.ESBuild原理解析





# 三。whycli脚手架开发

## 3.1.脚手架是实现的原理





## 3.2.version/options





## 3.3.whycli create功能





## 3.4.whycli addcpn功能





# 四。后台管理系统接口

- 那个图片之后截图
  - 标识符是角色接口和菜单接口

