# 一。webpack性能优化

## 1.1.Terser工具和配置

- 历史

  - 早期（webpack3/webpack4 初期）社区常用 `uglifyjs-webpack-plugin`（基于 UglifyJS）做 JS 压缩
  - 随着 ES2015+ 语法普及，UglifyJS 对部分新语法支持不够完善，后来社区更常用 **Terser**（对现代语法支持更好）
  - webpack4/webpack5 的生产模式（`mode: 'production'`）默认的 JS 压缩器就是基于 **Terser** 的（实现上由 `terser-webpack-plugin` 提供）

- 作用

  - 在生产构建中对 JavaScript 做最小化（minify），常见包括：
    - 删除空格/换行/注释
    - 缩短变量名（mangle）
    - 进行一定的表达式化简（compress）
    - 配合 tree-shaking 后进一步减小产物体积
  - 直接收益：
    - 产物更小，网络传输更快
    - 浏览器解析/执行压力更低（通常也会有收益）

  


### 使用方式一：terser命令行使用

#### 安装 terser CLI

```bash
npm i -D terser
```

#### 基本使用

```bash
npx terser ./src/index.js -o ./dist/index.min.js -c drop_console=true -m toplevel=true,keep_fnames=true
```

#### 常见补充

```bash
# 生成 source map（便于线上定位错误）
npx terser ./src/index.js -o ./dist/index.min.js -c -m --source-map
```

##### 配置信息解释

###### -c

- `--compress` 的简写
- 作用：压缩（做代码化简/删除冗余）
- 常见写法

```bash
# 直接开启 compress
npx terser ./src/index.js -o ./dist/index.min.js -c drop_console=true

# 删除 debugger
npx terser ./src/index.js -o ./dist/index.min.js -c drop_debugger=true

# 只删除 console.log（保留 console.error 等）
npx terser ./src/index.js -o ./dist/index.min.js -c "pure_funcs=['console.log']"
```

  - `drop_console=true`
    - 作用：删除 `console.*` 调用（常见是去掉日志）
    - 注意：
      - 这会让线上包更干净、更小
      - 但如果你依赖 `console` 做线上排查（或用日志上报），就不要开，或只在特定环境开

  - 其他常用 compress 选项
    - `drop_debugger=true`
      - 作用：删除 `debugger` 语句
    - `pure_funcs=['console.log']`
      - 作用：把指定函数调用当作“无副作用”，可以被安全删除
      - 常用来只删 `console.log`，保留 `console.error` 等
    - 示例





###### -m

- `--mangle` 的简写
  - 中文绞杀，意思就是截取
- 作用：混淆（主要是把变量/函数名改短）
- 常见写法

```bash
# 直接开启 mangle
npx terser ./src/index.js -o ./dist/index.min.js -m 

# 或传入 mangle 选项（示例）
npx terser ./src/index.js -o ./dist/index.min.js -m toplevel=true

# 混淆顶层 + 保留函数名
npx terser ./src/index.js -o ./dist/index.min.js -m toplevel=true,keep_fnames=true

# 保留 class 名称
npx terser ./src/index.js -o ./dist/index.min.js -m keep_classnames=true
```

  - `toplevel=true`
    - 作用：允许混淆顶层作用域（top-level）里的变量/函数名
    - 影响：通常压缩率会更好，但如果你依赖某些“顶层名字”（例如某些运行时通过全局变量名访问）可能会出问题
      - **message => m**
    
  - 其他常用 mangle 选项
    - `keep_classnames=true`
      - 作用：保留 class 名称
      - 场景：有些错误上报/日志/反射依赖 class 名字（例如 `err.name`、某些框架调试）
    - `keep_fnames=true`
      - 作用：保留函数名
      - 场景：依赖函数名做调试或某些序列化/反射场景
    - 示例



### 使用方式二：terser文件配置

- 安装

  - 如果你只是用 `mode: 'production'` 并接受默认压缩器：**不一定需要手动安装/配置**（webpack 会自动启用默认 minimizer）
  - 当你需要自定义 terser 行为（例如关闭 `.LICENSE.txt`、调参、只在某环境启用），就需要安装：

```bash
npm i -D terser-webpack-plugin
```



webpack.config.js（示例：自定义 minimizer）

```js
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          compress: true,
          mangle: true,
        },
      }),
    ],
  },
}
```

#### terserOptions中的其他配置属性

- keep_classnames: true
  - 保持类名

- keep_fnamse:true
  - 保持函数名

- 常用的 `compress` 选项
  - `arguments`
    - 作用
      - 它是 `compress.arguments`，默认值是 `false`
      - 开启后：在可确定安全的情况下，把 `arguments[index]` 替换成“形参名”
      - 目的：
        - 产物更短
        - 更利于后续压缩/内联（但并不是所有代码都会受益）
  
    - 使用
      - webpack.config.js（示例）
  

```js
new TerserPlugin({
  terserOptions: {
    compress: {
      arguments: true,
    },
  },
})
```

- 理解示例

```js
function sum(a, b) {
  return arguments[0] + arguments[1]
}

// 开启 compress.arguments 之后（能替换时）会倾向于变成
function sum(a, b) {
  return a + b
}
```

- - `drop_console:true`

    - 删除 `console.*`

  - `drop_debugger:true`

    - 删除 `debugger`

  - `pure_funcs:true`

    - 指定某些函数调用“可删除”（无副作用）

  - `toplevel:true`
    - 允许对顶层作用域做更多压缩（需要结合你的代码形态谨慎开启）

    



#### 常见注意点

- 一旦你手动配置 `optimization.minimizer`，会覆盖 webpack 的默认 minimizer
- 如果你还想保留默认 minimizer，再额外加其它压缩器（例如 CSS 压缩器），可以写：

```js
optimization: {
  minimizer: ['...', new CssMinimizerPlugin()],
}
```





## 问题：为什么  entry: './src/index.js',没效果

- 结果还是main.bundle.js

- ##### 你想输出成 `index.bundle.js` 的正确写法

  把 `entry` 改成对象形式，显式指定入口名：

  ```
  entry: {
    index: './src/index.js',
  },
  ```

  这样 `[name]` 就会变成 `index`，输出就是 `dist/js/index.bundle.js`。



## 1.2.css优化CSSMinimizerPlugin

- 作用
  - 对构建产物里的 **CSS 做压缩/最小化（minify）**，常见包含：
    - 删除空格、换行、注释
    - 合并/重排部分 CSS 规则（在不改变语义前提下）
    - 让最终的 `.css` 文件体积更小
  - 注意：它只负责“压缩 CSS”，不负责把 CSS 抽离成文件
    - 抽离 CSS 文件通常用 `mini-css-extract-plugin`
- 安装命令

```bash
npm i -D css-minimizer-webpack-plugin
```

- 代码
  - webpack.config.js（保留默认 JS 压缩 + 额外开启 CSS 压缩）

```js
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      '...',
      new CssMinimizerPlugin(),
    ],
  },
}
```

- new CssMinimizerPlugin() 使用默认配置就行
  -  new TerserPlugin（）也可以直接使用默认配置，看结果不满意再传入各种配置信息




## 1.3.代码的分离 - 开发和生产

- comm.config.js
- prod.config.js
- dev.config.js

### 记住dev和pro环境下webpack.json那些文件不同，以及执行命令也不同

#### dev为了测试，所以要开启本地服务才能看效果，那些优化或使打包文件更好看是production的事

**开发环境（dev）**：只管跑服务、热更新、快速调试 ✅

**生产环境（prod）**：只管优化、压缩、打包体积、性能 ✅



### 抽取方法

#### 抽取webpage.config.js为3个文件的步骤

1. 将配置文件导出的是个函数，而不是个对象
   - 目的：在一个地方拿到 `isProduction`，让部分配置可以动态决定（例如 css 的 loader）
2. 从上到下查看所有配置属性应该属于那个文件
   - comm/dev/prod
   - common：entry/output/resolve/module.rules(大部分)/plugins(大部分)/splitChunks 等
   - dev：devServer/devtool/开发体验相关
   - prod：minimizer、hash、source-map、提取 css、压缩等
3. 针对单独的配置文件进行定义化
   - 比如：css加载时不同的loader可以根据isProduction动态获取



### 具体代码

- package.json
  - 代码

```json
{
  "scripts": {
    "build": "webpack --config ./config/prod.config.js --mode production",
    "dev": "webpack serve --config ./config/dev.config.js --mode development"
  }
}
```

- 安装webpack-merge
  - 命令

```bash
npm i -D webpack-merge
```

- config/comm.config.js
  - 区分生产和开发
    - 公共配置写在 `comm.config.js`
    - `dev.config.js`/`prod.config.js` 用 `webpack-merge` 合并，并覆盖各自差异
  - 修改output
    - 通常把输出文件名、输出目录、是否 clean、hash 策略等，放在公共配置里

```js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env, argv) => {
  const isProduction = argv?.mode === 'production'
  const styleLoader = isProduction ? MiniCssExtractPlugin.loader : 'style-loader'

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: isProduction ? 'js/[name].[contenthash].js' : 'js/[name].bundle.js',
      chunkFilename: isProduction ? 'js/[name].[contenthash].chunk.js' : 'js/[name].chunk.js',
      clean: true,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    },
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                type: 'javascript/auto',
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
               
                }
            },
            // {
            //     test: /\.tsx?$/,
            //     exclude: /node_modules/,
            //     use: 'babel-loader'
            // },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: 'asset/resource'
            },
            {
                test: /\.css$/,
                use: [
                // 开发环境常用 style-loader（CSS 注入到 <style>）
                // 生产环境用 MiniCssExtractPlugin.loader（抽离成单独 css 文件）
                styleLoader,
                'css-loader', // 解析css
                ],
            },
        ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, '../public/view1.jpg'),
            to: path.resolve(__dirname, '../dist/view1.jpg'),
          },
        ],
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: 'css/[name].[contenthash].css',
              chunkFilename: 'css/[id].[contenthash].css',
            }),
          ]
        : []),
    ],
  }
}
```

- config/dev.config.js

```js
const { merge } = require('webpack-merge')
const common = require('./comm.config')

module.exports = (env, argv) =>
  merge(common(env, argv), {
    mode: 'development',
    devtool: 'eval',
    devServer: {
      open: true,
      port: 9000,
    },
  })
```

- config/prod.config.js

```js
const { merge } = require('webpack-merge')
const common = require('./comm.config')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = (env, argv) =>
  merge(common(env, argv), {
    mode: 'production',
    devtool: 'source-map',
    optimization: {
      minimize: true,
      minimizer: ['...', new CssMinimizerPlugin()],
    },
  })
```





## 1.4.JavaScript TreeShaking

- TreeShaking介绍
- 方式一：usedExports
- 方式二：sideEffects



## usedExports

#### 注意：

##### 1，测试把mode改为develpment，因为生产环境都内置好了，所以相关配置可能看不出效果

##### 2. 同时development不用开启本地serve，因为这里不看代码运行效果，而是打包后的文件有无优化

### 问题：还是能看到，

##### 解决

1. **生产模式的压缩器（Terser）+ minimize**
   也就是 `mode: 'develpment'` + `optimization.minimize: true`（或显式开启 minimizer）

2. devtool：false/source-map

理由：即使你开了 `minimize`，在 `eval` 模式下也经常出现：

- webpack 已经标记 unused（你能看到 `/* unused harmony export sub */`）
- 但最终代码仍保留函数声明（尤其是模块内部声明、调试友好输出时）

也就是说：**devtool 选择会显著影响你“肉眼观察 tree-shaking 是否删除代码”的结果**。





### 具体和作用

- `usedExports` 的核心作用：标记“哪些导出被用到了、哪些导出没用到”
- 没被用到的导出会被标记成 unused，然后在生产构建时配合压缩器（常见是 Terser）把它们从 bundle 里删除
- 注意点：
  - `usedExports` 负责“分析/标记”，真正把代码删掉通常发生在压缩阶段
  - 想 tree-shaking 生效，代码需要尽量使用 ESM（`import/export`），CommonJS（`require/module.exports`）效果会差很多

- 示例

```js
// utils.js
export const add = (a, b) => a + b
export const sub = (a, b) => a - b

// index.js
import { add } from './utils'
console.log(add(1, 2))
```

  - 理解：如果最终只有 `add` 被使用，`sub` 就有机会在生产构建中被移除

- 使用代码
  - webpack.config.js

```js
module.exports = {
  optimization: {
    usedExports: true,
  },
}
```

- 使用说明
  - `mode: 'production'` 下通常不需要你手动开启
    - webpack 在生产模式下会默认开启一系列优化（包含 tree-shaking 相关能力），并且默认会做压缩
  - `mode: 'development'` 下如果你想“验证有没有标记 unused”，可以手动开 `usedExports: true`
    - 但开发模式通常不会做完整压缩，所以你看到的“代码是否真的被删掉”可能不明显
  - 和 package.json的`sideEffects` 的关系
    - `usedExports`：告诉 webpack “哪些导出没用到”
    - `sideEffects`：告诉 webpack “这个模块/文件即使没被显式使用，也可能有副作用，不能随便删”

#### sideEffects的作用

- `sideEffects` 在哪里配置
  - 通常写在 `package.json` 中：

```json
{
  "sideEffects": false
}
```

- 它的核心含义
  - `sideEffects: false` 不是说“代码真的没有副作用”，而是**你向 webpack 声明**：
    - 如果某个文件的导出没有被使用，那么这个文件可以被安全删除（tree-shaking 可以大胆做）
  - 如果你不声明（或声明为 `true`），webpack 会更保守：
    - 可能会保留一些“看起来没被用到”的模块，避免误删造成运行时行为变化

- 常见的“副作用模块”示例
  - 引入 CSS（只为了让 CSS 生效，本身没有导出被使用）

```js
import './style.css'
```

  - 做全局修改/挂载（比如往 `window` 上挂东西）

```js
// polyfill.js
window.__APP_VERSION__ = '1.0.0'
```

  - 这类文件即使没有“导出被使用”，也不能删，否则页面样式/全局变量会消失

- 更细粒度的写法（推荐）
  - 不要一刀切全部 `false`，而是用数组告诉 webpack 哪些文件有副作用要保留
  - sideEffects的值可以是个数组
    - 注意下面匹配css的方法：*.css

```json
{
  "sideEffects": [
    "*.css",
    "./src/polyfill.js"
  ]
}
```

### 启发：尽量让所有的模块都没有副作用，即编写纯模块（类比纯函数）

- 理由
  - 更容易 tree-shaking
    - 未使用的导出/模块能被安全删除，bundle 更小
  - 更可预测、更好维护
    - 不靠“导入就自动执行的隐式行为”，依赖关系更清晰
  - 更利于复用与测试
    - 模块只暴露函数/类/常量，通过显式调用产生效果

- 例子
  - 有副作用的写法（导入即执行）

```js
// analytics.js
window.__APP_VERSION__ = '1.0.0'
export const a = 1
```

- 这个就是有副作用的模块，当使用usedExports和sideEffect：true时

  - 其他地方要是没引入a则analytics会被移除

  - 解决

    - 方式一：别写副作用的模块

    - 方式二：

      ```js
      {
        "sideEffects": [
          "*.css",
          "analytics.js"
        ]
      }
      ```

      



## 1.5.CSS TrassShaking


- 安装PurgeCSSPlugin和glob

  - 命令

```bash
npm i -D purgecss-webpack-plugin glob
```

- 使用

  - 文件路径
    - `PurgeCSSPlugin` 需要知道：你的项目里哪些文件会“用到 className”（HTML/JS/TSX/Vue 模板等）
    - 所以要配置 `paths`，把这些源码文件扫描一遍
      - glob.sync作用：
        - 根据你传入的 **glob 匹配模式**（例如 `src/**/*`）去磁盘上递归匹配文件
        - 返回一个“匹配到的文件路径数组”，用于交给 PurgeCSS 去逐个扫描 className
        - `nodir: true`：只返回文件，不返回目录（避免把目录当成扫描目标）

```js
const path = require('path')
const glob = require('glob')
const {PurgeCSSPlugin} = require('purgecss-webpack-plugin')

module.exports = {
  plugins: [
    new PurgeCSSPlugin({
      paths: glob.sync(`${path.join(__dirname, '../src')}/**/*`, {
        nodir: true,
      }),
    }),
  ],
}
```

- 注意：
  - 只建议在生产环境启用
    - 因为它需要扫描源码、计算未使用的 CSS，构建会更慢
  - 需要配合“抽离 CSS”效果最好
    - 一般配合 `mini-css-extract-plugin` 把 CSS 抽离成文件，然后再做 purge
  - 动态 className 容易被误删
    - 比如：`const cls = 'btn-' + type`、或者运行时拼接 class
    - PurgeCSS 静态扫描时看不到，就可能当成“没用到”给删掉
    - 解决：配置 `safelist`（白名单）保留它们

```js
new PurgeCSSPlugin({
  paths: glob.sync(`${path.join(__dirname, '../src')}/**/*`, { nodir: true }),
  safelist: {
    standard: ['active', 'open'],
    deep: [/^btn-/, /^ant-/],
  },
})
```





## 1.6.作用域提升 Scope Hoisting

### 方式一：new webpack.optimize.ModuleConcatenationPlugin()

- 作用
  - Scope Hoisting（作用域提升）的目标：把多个模块尽可能“串联”到同一个函数作用域中
    - 减少 webpack 为每个模块生成的函数包装（IIFE/闭包）
    - 减少运行时开销（函数调用、作用域链）
    - 产物体积通常也会更小
  - 简单理解
    - 未开启时：每个模块（每个文件，文件导入另一个文件）都有一层 `function(module, exports, __webpack_require__) { ... }`
    - 开启后：多个模块会被合并成更少的包装函数
      - 比如被导入的文件里面的函数直接放在了导入文件那个模块的作用域下

- 使用

  - 文件
    - webpack.config.js

```js
const webpack = require('webpack')

module.exports = {
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
}
```



### 方式二：webpack5 更常见的写法：直接用优化开关

```js
module.exports = {
  optimization: {
    concatenateModules: true,
  },
}
```

- 效果
    - bundle 中模块包裹函数数量变少
    - 运行时更接近“一个大作用域”的执行方式
    - 通常配合 tree-shaking、压缩（Terser）一起，收益更明显
- 注意
  - `mode: 'production'` 下通常默认就会开启（或等价优化会生效），不需要你手动加
  - 对 ESM（`import/export`）效果更好
    - CommonJS（`require`）模块之间更难做安全的拼接
  - 开发环境下不一定明显
    - dev 更关注构建速度与可调试性，可能不会做完整优化
  - 合并是“有条件”的
    - 只有在 webpack 判断模块拼接不会改变语义时才会做（否则会放弃拼接）





## 测试使用开发环境，因为生产环境那些配置好了，所以效果可能不明显



## 1.7.HTTP压缩 - gzip

### 概念

- gzip 是一种内容压缩格式（Content-Encoding）
  - 服务器把响应体（HTML/CSS/JS/JSON 等文本资源）压缩后再传输
  - 浏览器收到后**自动解压**，再交给渲染/执行
    - gzip这种压缩是浏览器和服务器内置好
- 目的
  - 减少传输体积（带宽更省、首屏更快）
  - 尤其对“文本资源”效果明显
    - JS/CSS/HTML/JSON
    - 图片（png/jpg）本身已压缩，再 用gzip 收益不大

- gzip 与 webpack 的关系
  - webpack 负责把代码打包成静态资源
  - gzip 通常发生在“静态资源被服务器返回给浏览器”这一层
    - 例如 nginx 开 gzip
    - 或用 `compression-webpack-plugin` 生成 `.gz` 文件给服务器直接返回

### 压缩流程

- 1. 浏览器发起请求（协商是否支持压缩）
  - 请求头带：`Accept-Encoding`
  - 示例

```http
GET /assets/app.js HTTP/1.1
Host: example.com
Accept-Encoding: gzip, deflate, br
```

- 2. 服务器选择一种编码并返回
  - 如果决定用 gzip 压缩响应体，会在响应头带：`Content-Encoding: gzip`
  - 响应体此时是“压缩后的二进制内容”

- 3. 浏览器根据响应头**自动解压**
  - 浏览器看到 `Content-Encoding: gzip` 就会先解压

  - 解压后得到原始内容，再交给 JS 引擎/渲染引擎

  - 示例

    ```http
    HTTP/1.1 200 OK
    Content-Type: application/javascript; charset=utf-8
    Content-Encoding: gzip
    Vary: Accept-Encoding
    Cache-Control: public, max-age=31536000
    ```

    

- 4. 缓存与代理的配合（很关键）
  - 同一个 URL 可能对不同客户端返回不同编码（gzip / br / 不压缩）
  - 所以需要 `Vary: Accept-Encoding`来避免缓存混乱



#### 缓存与代理的配合 和 Vary: Accept-Encoding 解释

##### 问题背景

同一个 **URL**，服务器可能根据客户端请求头，返回**不同响应内容**：

- 部分客户端支持 `gzip` 压缩
- 部分客户端支持 `br` 压缩
- 老旧客户端不支持压缩，返回原始明文内容

如果缓存服务器 / 浏览器只以「URL」作为缓存唯一 key，就会出现：

A 客户端拿到压缩版缓存，B 不支持压缩的客户端复用该缓存，导致**页面乱码、解析失败**，造成缓存错乱。



##### Vary: Accept-Encoding 作用

1. 改变缓存匹配规则

   告诉缓存（浏览器、CDN、反向代理）：

> 不能只靠 `URL` 判断缓存是否命中，还要额外校验**请求头里的 Accept-Encoding**

2. 差异化缓存

​	缓存会根据「URL + Accept-Encoding 请求头」组合生成独立缓存：

- 携带 `Accept-Encoding: gzip, br` → 缓存压缩版响应
- 无压缩请求头 → 缓存原始无压缩响应

3. 避免跨客户端缓存污染

​	防止压缩版响应被不支持压缩的客户端读取，彻底解决编码不一致导致的乱码、解析错误。



### 响应式和请求头的返回数据详解

- 请求头（Request Headers）
  - `Accept-Encoding`
    - 告诉服务器：客户端支持哪些压缩格式
    - 常见值：`gzip, deflate, br`

- 响应头（Response Headers）
  - `Content-Encoding: gzip`
    - 表示响应体使用 gzip 压缩
  - `Vary: Accept-Encoding`
    - 告诉 CDN/代理/浏览器缓存：同一资源需要按 `Accept-Encoding` 维度区分缓存
  - `Content-Type`
    - 资源类型（例如 `text/css`、`application/javascript`）
  - `Content-Length`
    - 如果是普通响应：表示压缩后响应体的字节长度
    - 如果是分块传输，可能看不到它，而是 `Transfer-Encoding: chunked`
  - `ETag` / `Last-Modified`
    - 与缓存相关：资源是否变化
    - 注意：在启用压缩的情况下，不同编码可能导致不同的 ETag（不同字节内容）

  





## 1.8.HTML文件压缩

- HTMLWebpackPlugin

- 使用

  - 文件
    - webpack.config.js

```js
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      minify: {
        collapseWhitespace: true, // 折叠空白：删除多余空格/换行，让 HTML 更紧凑
        removeComments: true, // 删除 HTML 注释
        removeRedundantAttributes: true, // 删除冗余属性（例如某些默认值属性）
        removeEmptyAttributes: true, // 删除空属性（例如 class=""）
        useShortDoctype: true, // 使用短 doctype：<!doctype html>
        minifyCSS: true, // 压缩 HTML 内联的 CSS（<style> 或 style=""）
        minifyJS: true, // 压缩 HTML 内联的 JS（<script>）
      },
    }),
  ],
}
```

- 常用属性介绍

  - `template`
    - 作用
      - 指定 HTML 模板文件（一般把你手写的 `index.html` 当模板）
    - 例子

```js
new HtmlWebpackPlugin({
  template: './public/index.html',
})
```

  - `filename`
    - 作用
      - 生成的 HTML 文件名
    - 例子

```js
new HtmlWebpackPlugin({
  filename: 'index.html',
})
```

  - `inject`
    - 作用
      - 控制把打包后的 js/css 标签注入到哪里
      - 常见：`true`（默认，自动注入）、`'head'`、`'body'`
    - 例子

```js
new HtmlWebpackPlugin({
  inject: 'body',
})
```

  - `minify`
    - 作用
      - 控制 HTML 压缩行为（去空格、去注释、压缩内联 JS/CSS 等）
    - 例子

```js
new HtmlWebpackPlugin({
  minify: {
    collapseWhitespace: true,
    removeComments: true,
  },
})
```

- 注意
  - `mode: 'production'` 时很多脚手架会默认对 HTML 做压缩
    - 但如果你自定义了 `HtmlWebpackPlugin` 的 `minify`，最终以你的配置为准





# 二。打包的性能分析

## 2.1.时间的分析

### speed-measure-webpack-plugin

- 作用

  - 统计 webpack 构建过程中各个阶段的耗时
    - 哪个 loader 最慢
    - 哪个 plugin 最慢
    - 哪个阶段（compilation/emit 等）耗时最多
  - 目的：定位“慢在哪里”，再针对性优化

- 安装命令

```bash
npm i -D speed-measure-webpack-plugin
```

- 使用

  - 文件

    - webpack.config.js

    ```js
    const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
    
    const smp = new SpeedMeasurePlugin()
    
    module.exports = smp.wrap({
      // 这里放你的原 webpack 配置
    })
    ```

    

- 注意

  - 它适合用于“分析/定位”，不建议长期一直开
    - 因为它会包一层统计逻辑，构建时间可能会被拉长
  - 可能和某些插件/配置存在兼容性问题
    - 如果 wrap 后报错，可以先缩小配置范围或只包一部分，再逐步排查
  - 统计结果是“参考值”
    - 不同机器、是否命中缓存、冷热启动差异都会影响耗时



### 问题：**SMP 会包裹/代理 webpack 的 compiler**，导致 `MiniCssExtractPlugin.loader` 在内部检测插件时“看不到”对应插件，于是直接报错

#### 解决

- **新增**：`useSmp` 开关（读取 `--env smp=true`）
- **当 `smp=true` 时**：
  - CSS loader **改用** `style-loader`
  - 并且 **不再注入** `new MiniCssExtractPlugin()`
- **当正常生产构建（不带 smp）时**：
  - CSS loader 仍是 `MiniCssExtractPlugin.loader`
  - plugins 里仍有 `new MiniCssExtractPlugin()`





### 优化时间方式：babel-loader的rules添加exclude：‘node_module'可以减少打包时间

- 解释

  - 原理
    - `babel-loader` 转换 JS/TS 是非常耗时的
    - `node_modules` 里的第三方依赖通常已经发布为“可直接运行”的产物（很多都编译过）
    - 所以一般**不要再用 babel 去处理 node_modules**，否则会导致构建时间暴涨
  - 如何配置

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
}
```

  - 补充
    - 如果你遇到某些第三方库“语法太新（比如没转 ES5）导致兼容问题”，才考虑把它加入 babel 转译白名单
    - 常见做法是：用 `include` 精确指定需要转译的少数包，而不是把整个 `node_modules` 都交给 babel



## 2.2.结果的分析

### package.json的sript添加 xx --profile --json=stats.json

- 使用过程

  - 1. 在 `package.json` 里新增一个脚本（示例）

```json
{
  "scripts": {
    "build:stats": "webpack --mode production --profile --json=stats.json"
  }
}
```

  - 2. 执行命令生成分析文件

```bash
npm run build:stats
```

  - 3. 得到 `stats.json`
    - 这个文件记录了本次构建的模块、chunk、资源体积、依赖关系、耗时等信息
    - 后续可以把它喂给可视化工具（例如 bundle analyzer）查看“包里到底有什么、谁最大”
      - 网站
        - https://webpack.github.io/analyse/（推荐）
        - 或https://chrisbateman.github.io/webpack-visualizer/
        - 还有其他，问ai
    
- 注意
  - `stats.json` 可能非常大
    - 不建议提交到 git（建议加入 `.gitignore`）
  - 建议在生产模式下生成
    - dev 模式下为了调试会产生更多额外信息，不利于分析真实产物
  - 只是一份“数据”，需要配合工具可视化更直观
    - 常见：`webpack-bundle-analyzer`

### 方式二：webpack-bundle-analyzer

- 安装命令

```bash
npm i -D webpack-bundle-analyzer
```

#### 使用方式一

- 文件

```js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = (env) => {
  const isProduction = env === 'production'
  const isAnalyze = env === 'analyze'

  return {
    mode: isProduction ? 'production' : 'development',
    plugins: [
      isAnalyze &&
        new BundleAnalyzerPlugin({
          // server: 启动一个本地 server 页面，默认会自动打开浏览器
          analyzerMode: 'server',
          openAnalyzer: true,
          // 也可以选择静态报告（不启动 server）：analyzerMode: 'static'
          // 生成文件默认是 report.html（可通过 reportFilename 修改）
        }),
    ].filter(Boolean),
  }
}
```

- 设置脚本

  ```js
      "analyze": "webpack --mode production --env analyze=true",
  ```

  

#### 使用方式二：配合 `stats.json` 的使用方式（不改 webpack 配置也可以）

```bash
# 1. 先 生成 stats.json
webpack --mode production --profile --json=stats.json
或者通过方式一生成

# 2. 用 analyzer 读取 stats.json 打开分析页面 -- 等于方式一中再把stats.json放到可视化网站显示
npx webpack-bundle-analyzer stats.json
```

- 注意
  - 建议在 `production` 模式下分析
    - 更接近真实线上产物（tree-shaking / minimizer / splitChunks 等会影响最终体积）
  - 分析的重点不是“文件个数”，而是“谁占体积最大、是否重复引入”
    - 典型问题：重复的第三方库、某个页面意外引入了整个工具库、图片/字体过大
  - `stats.json`/报告文件可能很大
    - 不建议提交 git，按需生成



# 三。webpack源码阅读

## 3.1.根据案例进行源码阅读

- 从源码/lib这个目录开始看

- 先运行lib

  - 文件

    ```js
    const webpack = require('../lib/webpack')
    const config = require('./webpack.config')
    
    const compiler = webpack(config)
    
    compiler.run((err, stats) => {
      if (err) {
        console.error(err)
      } else {
        console.log(stats)
      }
    })
    ```

    - 然后给第三行（`const compiler = webpack(config)`）打断点，通过调试工具进入 `../lib/webpack`
      - 而不是逐个文件看
    - 这样做的目的
      - 从“入口函数”开始，跟着调用栈走，能快速看到 webpack 初始化流程里最关键的对象和步骤
        - `webpack(config)` 返回 `compiler`
        - `compiler.run(...)` 才是启动一次完整构建
    - 调试时重点关注的点
      - `webpack(config)` 内部如何把 `config` 标准化（默认值合并、插件初始化等）
      - `Compiler` 对象的创建过程（`hooks`、`options`、`inputFileSystem/outputFileSystem` 等）
      - `run` 的生命周期里会触发哪些关键 hook（这是插件体系的核心）

