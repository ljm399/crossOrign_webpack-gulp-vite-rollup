### 老师代码问题也是通过clg打印得出，只不过老师是最后才用clg


# 一。webpack源码阅读

```js
const webpack = require('../lib/webpack')
const config = require('./webpack.config')

const compiler = webpack(config)

compiler.run((err, stats) => {
  if (err) {
    console.error(err)
    return
  }

  if (stats?.hasErrors()) {
    console.error(stats.toString({ colors: true }))
    compiler.close(() => {})
    return
  }

  console.log(stats.toString({ colors: true }))
  compiler.close(() => {})
})

```

## 对const compiler = webpack(config)打断点

### 首先注册plugins返回compiler

#### 1. 入口：从 run.js 进入 webpack(config)

- **触发点**：`const compiler = webpack(config)`
- **核心目标**：根据你的 `webpack.config.js` 里的配置，创建 `compiler`，并把配置（尤其是 `plugins`、`entry`、`output` 等）“应用”到 `compiler` 上。

#### 2. plugins 的注册（函数插件 vs 对象插件）

- **配置来源**：`webpack.config.js` 里的 `plugins: []`
- **注册方式**（源码中会遍历 `options.plugins`）：
  - **如果 plugin 是函数**：相当于把它当作 `WebpackPluginFunction`，直接调用
    - 形态：`plugin.call(compiler, compiler)`
    - 理解：函数内部通常会做 `compiler.hooks.xxx.tap(...)` 之类的注册
  - **如果 plugin 不是函数（一般是对象）**：要求它实现 `apply`
    - 形态：`plugin.apply(compiler)`
    - 理解：`apply(compiler)` 里同样是去 `tap` 各种 hooks

#### 3. “把 options 应用到 compiler” 的统一入口（entry/output 等）

- **统一处理者**：`WebpackOptionsApply`（你在源码里看到的就是类似 `new WebpackOptionsApply().process(options, compiler)`）
- **作用**：把 `options` 上的很多字段（例如 `entry`、`output`、`resolve`、`module.rules` 等）转成对 `compiler` 的一系列配置与插件安装。
- **思路**：很多配置最终都会落到“同一种模式”上
  - **要么**：把某个能力做成 plugin（内部 `apply` 到 `compiler`）
  - **要么**：把某个配置转成 `compiler` 上的属性/工厂/规则，然后在后续编译流程里使用

#### 4. 小结

- `webpack(config)` 的关键不是“马上开始打包”，而是：
  - **创建 `compiler`**
  - **把 options（尤其 plugins/entry/output）应用到 compiler**
  - 为后面的 `compiler.run()` 真正开始编译做准备



## 从 webpack() 到写入输出文件（包括上面的内容）

#### 1. webpack(config) 创建 compiler

- `webpack(config)` 会创建 `compiler`（可以理解为“总调度/总导演”）
- `compiler` 负责：
  - 管理整个构建生命周期
  - 提供 hooks（插件扩展点）
  - 启动一次编译（run/compile）
  - 最终输出资源（emitAssets）

#### 2. compiler.hooks：注册所有 plugins（不包括 `module.rules`）

- 读取 `webpack.config.js` 的 `plugins: []` **并遍历**
- 插件两种形态：
  - 函数插件：`plugin.call(compiler, compiler)`
  - 对象插件：`plugin.apply(compiler)`
- 插件本质上是在 `apply` 里对 `compiler.hooks.xxx.tap(...)` 进行订阅

#### 3. compiler.run -> compile：创建 compilation（本次构建现场）

- `compiler.run()` 后会进入 `compile`
- 在编译阶段会创建 `compilation`
- `compilation` 可以理解为“一次构建的工作台/现场”，它会收集：
  - modules / chunks / assets 等本次构建数据

#### 4. 从入口开始构建依赖图：addEntry -> factorize（模块工厂化） -> addModule

- `compilation.addEntry(...)`：把 `entry` 作为起点加入构建
- **factorize（模块工厂化）/ NormalModuleFactory**
  - 作用：把一个依赖请求（例如 `import "./a"`）解析并“工厂化”为真正的 `Module` 对象
  - 补充：
    - 通常一个文件（一个 resource）对应一个 `Module`
    - 一个文件 `import` 多个依赖，会触发创建多个“依赖模块”（依赖图里 `Module` 数量变多即多个modules）
    - 若 同一个依赖被多处引用时，一般会复用同一个 `Module`（不会重复创建很多份）
- 每个module（模块）创建出来后依次会 `addModule` 加入 `compilation`

#### 5. needBuild -> buildModule -> module.build -> doBuild -> runLoaders()

- `needBuild`：判断该模块是否需要构建（缓存/是否已构建等）
- 需要构建则进入 `buildModule`，并进入构建队列（老师笔记里的 `buildQueue`）
- 真正构建发生在：
  - `module.build(...)`
  - `doBuild(...)`
  - `runLoaders()`：执行 loader 链（pitch/normal），得到转换后的源码等
- 然后 webpack 会解析源码得到依赖，递归重复上述流程，逐步构建出依赖图

#### 6. seal：收口并决定输出哪些文件

- seal中文释义：封装

- 当所有模块构建完成后，`compilation.seal()` 进入收口阶段
- seal 阶段会：
  - 组织 modules -> chunks
  - 生成最终需要输出的 assets（有哪些文件、每个文件里是什么内容）

#### 7. onCompiled 回调 -> emitAssets：写入 output 目录

- 编译结束后进入 `onCompiled`（可以理解为 run 的回调链路的一部分）
- `emitAssets`：把生成的 assets 输出到 `output.path`
  - 确保输出目录存在（创建文件夹）
  - 写入文件（最终 dist 产物落盘）

#### 8. 一段话复述（背诵版）

- `webpack(config)` 创建 `compiler`，并把 `plugins/entry/output` 等配置应用到 `compiler`；
- plugins 通过 `compiler.hooks` 注册；
- `compiler.run` 进入编译，创建本次 `compilation`；
- 从 `addEntry` 开始，经由模块工厂（factorize/NormalModuleFactory）创建模块并 `addModule`；
- 判断 `needBuild` 后进入 `module.build`，内部 `runLoaders()` 执行 loader 链并解析依赖递归构建；
- 最后 `seal` 生成 chunks/assets，`emitAssets` 把资源写入 `output` 目录。





# 编译器里面调试工具的解释（VS Code 调试工具栏：从左到右）

#### 1. 继续/暂停（Continue / Pause）

- **作用**
  - 继续运行程序，直到**下一个断点**停下
  - 如果当前正在运行，则按钮会显示“暂停”，用于把程序暂停在当前执行位置
- **使用场景**
  - 你已经在 `webpack(config)` 停住了，想直接跑到下一个断点（例如跑到遍历 `options.plugins` 的位置）
  - 你不想逐行看，想快速跳到下一个关键阶段

#### 2. 单步跳过（Step Over）

- **作用**
  - 执行当前行，但**不进入该行调用的函数内部**
  - 如果当前行有函数调用，会把它当作黑盒执行完，再停到下一行
- **使用场景**
  - 你只想确认 `plugin.apply(compiler)` 被调用了，但暂时不想进入插件内部
  - 当前行调用链很深，先用 Step Over 保持主流程的可读性

#### 3. 单步进入（Step Into）

- **作用**
  - 执行当前行，并**进入该行调用的函数内部**
- **使用场景**
  - 你想深入关键逻辑时使用，例如：
    - 进入 `webpack(config)` 的内部实现
    - 进入 `new WebpackOptionsApply().process(options, compiler)` 看 `entry/output/...` 如何被应用
    - 进入 `plugin.apply(compiler)` 看插件如何注册 hooks

#### 4. 单步跳出（Step Out）

- **作用**
  - 让当前函数直接执行到返回，然后回到上一层调用处（停在调用语句的下一行）
- **使用场景**
  - 你 Step Into 进深了，发现这一层不是重点，想快速回到外层主流程

#### 5. 重启（Restart）

- **作用**
  - 重新启动整个调试会话（从入口文件重新跑一遍）
- **使用场景**
  - 你调整了断点/条件断点/观察表达式后，想从头再走一遍 `run.js`

#### 6. 停止（Stop）

- **作用**
  - 结束当前调试进程
- **使用场景**
  - 程序跑飞/卡住/进入你不想看的分支时直接终止







# 二。自定义loader

### 先配置测试文件夹

- 安装webpack

  - webpack webpack-cli

- npm init

- 配置webpack.config.js

  - 初始化项目

    ```bash
    npm init -y
    ```
  
  - 安装 webpack
  
    ```bash
    npm i -D webpack webpack-cli
    ```

  - 配置 `webpack.config.js`
  
    ```js
    const path = require('path')
    
    module.exports = {
      mode: 'development',
      entry: './src/index.js',
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
      }
    }
    ```

  - 添加入口文件 `src/index.js`
  
    ```js
    console.log('hello loader')
    ```
  
  - 配置 `package.json` 脚本（方便后面调试 loader）
  
    ```json
    {
      "scripts": {
        "build": "webpack",
        "build:watch": "webpack --watch"
      }
    }
    ```
  
  - 运行验证
  
    ```bash
    npm run build
    ```
  
  - 结果：生成 `dist/bundle.js`（后面写自定义 loader 时，只需要在 `module.rules` 里加上你的 loader 即可验证效果）

## 2.1.认识自定义loader

- 概念
  - loader 本质上是一个 **模块转换器**：webpack 读取到某个模块的源码后，会把源码交给 loader 链处理
  - loader 一般导出一个函数，**接收模块内容并返回“转换后的内容**”（再交回 webpack 继续解析依赖/打包）


### 测试方式

#### 配置一个loader（先看）

- 文件（`./src/hy-loader/replace-loader.js`）

  ```js
  module.exports = function (content) {
    console.log('hy_loader01', content) //hy_loader01 console.log('hello loader')
    return content.replace(/hello/g, 'hi')
  }
  ```

  - console.log('hello loader')这个代码在入口文件即  entry: './src/index.js',里面

    ```js
    console.log('hello loader')
    ```

  - return content.replace(/hello/g, 'hi')作用；使打包后的文件变化

    ```js
    本来
    eval("{console.log('hello loader')\n\。。。
    变为
    eval("{console.log('hi loader')\n\。。。。
    ```

- loader函数会接受3个参数即module.exports = function (content，map，meta) {

  1. `content`
     - 作用
       - 当前模块的源码内容（通常是字符串）
       - 你主要对它做字符串处理/AST 处理，然后返回新的源码
  2. `map`（了解）
     - 作用
       - sourcemap（上一个 loader 传下来的映射）
       - 你如果改了源码且要保证调试/报错行列准确，需要把更新后的 map 继续往下传（不处理也可以传回原样/空）
  3. `meta`（了解）
     - 作用
       - 元信息对象（上一个 loader 传下来的额外数据）
       - 多个 loader 串联时，可以用它在 loader 链之间传递自定义信息

- webpack.config.js

  ```js
  const path = require('path')
  
  module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            path.resolve(__dirname, './src/hy-loader/replace-loader.js')
          ]
        }
      ]
    }
  }
  ```



#### 多个loader

- 第一个 loader（`./src/hy-loader/01.js`）

  ```js
  module.exports = function (content) {
    console.log('hy_loader01', content) // hy_loader01 // banner from hy_loader02 console.log('hello loader')
      ---- console.log('hello loader')是下面的./src/hy-loader/02.js返回的${content}
      
    return content.replace(/hello/g, 'hi')
  }
  ```

- 第二个 loader（`./src/hy-loader/02.js`）

  ```js
  module.exports = function (content) {
    console.log('hy_loader02', content)//hy_loader02 console.log('hello loader')
    return `// banner\n${content}`
  }
  ```

- webpack.config.js（多个 loader 默认 **从右到左**”**从下到上**““ 执行）

  ```js
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            path.resolve(__dirname, './src/hy-loader/01.js'),
            path.resolve(__dirname, './src/hy-loader/02.js')
          ]
        }
      ]
    }
  }
  ```

#### 注意


- loader导出要commjs，不能esmodule
  - 理由
    - loader 运行在 Node 环境，webpack 在加载 loader 时会用 Node 的 `require` 去加载（尤其是在 CommonJS 配置文件环境里）
    - 如果你直接写 `export default ...`，Node 的 `require` 无法直接拿到导出函数（除非额外开启/配置 ESM 兼容），会导致“loader 不是函数”之类的错误



## 2.2.loader的执行顺序

### 只要设置了pitch，就可能会有两个阶段（pitch和normal）


### pitch

- 作用
  - 每个 loader 都可以额外导出一个 `pitch` 函数：`loader.pitch = function (...) {}`
  - pitch 用来在 normal 之前“抢先一步”做准备/短路：
    - 记录日志、收集信息
    - 直接返回一个结果来 **跳过后续 loader 的 normal 执行**（用于某些优化场景）
  - pitch 执行方向：从左到右
- 使用场景
  - 在真正读取/处理模块内容之前做一些“预处理/缓存命中判断”
  - 多个 loader 之间需要提前协商信息（通过 pitch 参数或共享状态）
  - 需要短路 loader 链：例如命中缓存时，直接在 pitch 返回结果，跳过后续 normal

#### 注意

##### 1) 不写 `pitch` 也“有两个阶段”吗？
从执行模型上说，webpack **仍然会走“pitch 流程”**，只是：
- **没有定义 `pitch` 的 loader 等同于 pitch 什么都不做**
- 你就“看不到” pitch 的日志/效果

所以你在现象上会觉得：只有 normal 阶段。

##### 2) 写了 `pitch` 一定两个阶段都执行吗？
**不一定**，因为 `pitch` 可能会“短路” normal：

- **正常情况（pitch 不 return 值）**
  - 先按 **从左到右** 执行各 loader 的 `pitch`
  - 再按 **从右到左** 执行各 loader 的 `normal`

- **短路情况（某个 `pitch` `return` 了内容）**
  - **后面（右边）的 loader 的 normal 会被跳过**
  - 然后会开始回退执行 **已经走过 pitch 的 loader 的 normal**（从当前 loader 往左）

所以：**“设置了 pitch”≈“可能会出现 pitch+normal 两个阶段”**；在绝大多数不短路的场景下，你观察到的就是两个阶段。




### normal

- 作用
  - 真正对模块内容做转换的阶段（你在 loader 里 `module.exports = function (content) {}` 这部分）
  - normal 执行方向：从右到左

- 使用场景
  - 最常见：把输入内容转换成输出内容
    - 字符串替换/注入代码
    - 解析 AST 并生成新代码
    - 把非 JS 资源（md/txt 等）转成 JS 模块字符串


### enforce:pre/post

- 作用
  - 改变 loader 的“分组优先级”，从而影响最终执行顺序
  - 可以理解成会把所有命中的 loader 拆成三组：
    - **pre**（最先处理）
    - **normal**（默认组）
    - **post**（最后处理）
  - 最终执行顺序可以概括为：
    - pitch：`pre -> normal -> post`（每组内仍然从左到右）
    - normal：`post -> normal -> pre`（每组内仍然从右到左）

- 使用场景
  - `pre`：希望尽早执行的“检查/预处理”类 loader（例如 eslint-loader 这类历史用法）
  - `post`：希望在所有转换后再执行的“收尾/格式化/统计”类 loader
  - 需要把某个 loader 固定到链路的最前或最后，避免顺序被其它 loader 影响

### 使用

#### 注意

- `pitch` 只是在 normal 之前的一个“可选阶段”，不是每个 loader 必须实现

  - 有两个阶段

- 想观察执行顺序时，用 `console.log` 最直接；执行一次 `npm run build` 看终端输出即可

- 如果某个 loader 的 `pitch`  直接 **return 了内容**，会发生短路：

  - 后面的 loader 不会再进入 normal

- **易错点**：`enforce`写法是写在 `rules` 级别（而不是 `use` 的单个项上），例如：

  ```js
  {
    test: /\.js$/,
    enforce: 'pre',
    use: [path.resolve(__dirname, './src/hy-loader/pre-loader.js')]
  }
  ```



#### 使用代码

```js
// ./src/hy-loader/pre-loader.js
module.exports = function (content) {
  console.log('normal: hy_loader03 pre',content)
  return content
}

module.exports.pitch = function () {
  console.log('pitch: hy_loader03 pre')
  // return 'console.log("hy_loader03 pre")'
}

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

```js
// ./src/hy-loader/post-loader.js
module.exports = function (content) {
  console.log('normal: hy_loader03b post',content)
  return content
}

module.exports.pitch = function () {
  console.log('pitch: hy_loader03b post')
  // return 'console.log("hy_loader03b post")'
}

```

- webpack.config.js

  ```js
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
                // 2.2：enforce: pre/post（注意：enforce 只能写在 rule 上，不能写在 use 的单项上）
                {
                  test: /\.js$/,
                  enforce: 'pre',
                  use: [path.resolve(__dirname, './hy-loaders/hy_loader03.js')]
                },
                {
                  test: /\.js$/,
                  use: [
                    path.resolve(__dirname, './hy-loaders/hy_loader02.js'),
                  ]
                },
                {
                  test: /\.js$/,
                  enforce: 'post',
                  use: [path.resolve(__dirname, './hy-loaders/hy_loader03b.js')]
                }
          ]
        }
      ]
    }
  }
  ```

#### 结果（先看）

- 当有enforce: 'pre',和 enforce: 'post',时

  ```
  pitch: hy_loader03b post
  pitch: hy_loader02
  pitch: hy_loader03 pre
  normal: hy_loader03 pre console.log('hello loader')
  
  normal：hy_loader01 console.log('hello loader')
  
  normal: hy_loader03b post // banner from hy_loader02
  console.log('hi loader')
  ```

- 没有

  ```
  pitch: hy_loader03 pre
  pitch: hy_loader02
  pitch: hy_loader03b post
  normal: hy_loader03b post console.log('hello loader')
  
  normal：hy_loader02 console.log('hi loader')
  
  normal: hy_loader03 pre // banner from hy_loader02
  console.log('hi loader')
  ```

  



## 2.3.loader的同步和异步

- 问题背景
  - loader 在构建阶段运行，有时需要做一些异步工作，例如读取文件、调用异步工具链等
  - webpack 需要知道 loader 什么时候处理完成：
    - 同步：直接 `return` 或 `this.callback()`
    - 异步：用 `this.async()` 拿到 callback，异步结束后调用 callback


#### 同步（就是你平时的return）

- 使用方式一：返回值（推荐）
  - 直接 `return` 转换后的内容
  - 示例（`./src/hy-loader/sync-return-loader.js`）

    ```js
    module.exports = function (content) {
      return `${content}\nconsole.log('sync-return-loader')`
    }
    ```
- 使用方式二：this.callback()
  - 用 `this.callback(err, result, map, meta)` 返回
  - 示例（`./src/hy-loader/sync-callback-loader.js`）

    ```js
    module.exports = function (content) {
      const result = `${content}\nconsole.log('sync-callback-loader')`
      this.callback(null, result)
    }
    ```

  - 函数参数解释
    - `err`
      - 作用
        - 错误对象，传了会让本次构建失败（通常传 `null`）
    - `result`
      - 作用
        - 处理后的源码（字符串）或 Buffer（取决于 loader 类型）
    - `map`（了解）
      - 作用
        - sourcemap，保持调试/报错行列准确（没有就传 `undefined`）
    - `meta（了解）`
      - 作用
        - 自定义元信息，供后续 loader 使用（没有就传 `undefined`）

#### 异步

- this.async()
  - `const callback = this.async()`
  - 异步完成后：`callback(err, result, map, meta)`

  - 参数解释
    - callback 的 4 个参数含义与 `this.callback(err, result, map, meta)` 完全一致


- 使用（settimeout）
  - 文件（`./src/hy-loader/async-timeout-loader.js`）

    ```js
    module.exports = function (content) {
      const callback = this.async()
      setTimeout(() => {
        const result = `${content}\nconsole.log('async-timeout-loader')`
        callback(null, result)
      }, 1000)
    }
    ```
  
    - 没有const callback = this.async()和callback(null, result)这些则返回的是undefined
  
  - 文件（`./src/hy-loader/sync-return-loader.js`）
  
    ```js
    module.exports = function (content) {
      log(`${content}\nconsole.log('sync-return-loader')`)
      return `${content}\nconsole.log('sync-return-loader')`
    }
    ```
  
    - 上面要是没有async，则这里打印结果是undefined\nconsole.log('sync-return-loader')
  
  - webpack.config.js（使用片段）
  
    ```js
    const path = require('path')
    
    module.exports = {
      module: {
        rules: [
          {
            test: /\.js$/,
            use: [
              path.resolve(__dirname, './src/hy-loader/sync-return-loader.js'),
              path.resolve(__dirname, './src/hy-loader/async-timeout-loader.js')
            ]
          }
        ]
      }
    }
    ```
  
  - 现象
    - 构建会先等待 1s（异步 loader 结束）
    - 最终 `dist/bundle.js` 里会看到两行注入的 `console.log`（说明 loader 链生效）
  

##### 注意 

- 同一个 loader 只能选择一种返回方式：`return` 或 `this.callback` 或 `this.async + callback`
- 异步 loader 如果忘记调用 callback，会导致构建一直挂起



## 2.4.Loader参数获取和检验

- this.getOptions- 参数获取

  - 使用

    - 文件（`./src/hy-loader/options-loader.js`）

      ```js
      module.exports = function (content) {
        const options = this.getOptions() || {}
        const prefix = options.prefix ?? 
        console.log('options-loader',prefix, content);
        console.log('---------------');
        
        return `${prefix}\n${content}`
      }
      
      ```

      - 结果：hy_loader05 //  hello from webpack options console.log('hello loader')
    
    - webpack.config.js（传参）

      ```js
        module: {
          rules: [
            {
              test: /\.js$/,
              use: [
                {
                  loader: path.resolve(__dirname, './src/hy-loader/options-loader.js'),
                  options: {
                    prefix: "// hello from webpack options"
                  }
                }
              ]
            }
          ]
        }
      }
      ```
    
    - 现象
      - 打包后的 `dist/bundle.js` 顶部会多出一行 `// hello from webpack options`
    
      
  
- validate

  - 一般用于对上返回的options进行校验

  - 使用

    - 安装

      ```bash
      npm i -D schema-utils
      ```

    - 文件（`./src/hy-loader/validate-options-loader.js`）

      ```js
      const { validate } = require('schema-utils')
      
      const schema = {
        type: 'object',// options是个对象
        properties: {// options里面具体值
          hyprefix: {// 其中一个属性hyprefix类型是string
            type: 'string'
          }
        },
        additionalProperties: false
      }
      
      module.exports = function (content) {
        const options = this.getOptions() || {}
        validate(schema, options, { name: 'validate-options-loader' })
        // { name: 'validate-options-loader' }
        // - 用于标识“是谁在做校验”（通常写 loader 名字）
        // - 当校验失败报错时，错误信息里会带上这个 name，方便快速定位是哪个 loader 的 options 写错了
      
        const prefix = options.prefix ?? '// prefix from validate-options-loader'
        return `${prefix}\n${content}`
      }
      ```
      
    - webpack.config.js（传参）
    
      ```js
              use: [
                {
                  loader: path.resolve(__dirname, './src/hy-loader/validate-options-loader.js'),
                  options: {
                    hyprefix: "// validated prefix"
                  }
      ```
      
      用于
      - 让 loader 的参数更安全：参数不符合 schema 时直接报错，避免静默产出错误结果







## 2.5.案例  md-loader

### 效果：使md格式文档可以在网页显示

### 文件作用

- 先创建要编译和打包的md文件

  - `src/hymd.md`

    ````js
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
    ````

- `hy-loaders/hymd-loader.js`

  - 安装webpack

    ```
    npm i -D webpack webpack-cli
    ```

  - 安装 `marked` 和 `html-webpack-plugin`

    ```bash
    pnpm add -D marked html-webpack-plugin
    ```

  - `marked` 用于把 markdown 转成 html 字符串

  - `html-webpack-plugin` 用于生成 html 文件，并把打包后的 js 自动注入到页面

  - 具体内容（`hy-loaders/hymd-loader.js`）

    ```js
    const { marked } = require('marked')
    
    module.exports = function (content) {
      const html = marked.parse(content)
      return `module.exports = ${JSON.stringify(html)}`
    }
    ```

- 配置webpack.config.js 完善和补充

  - `src/index.js`（把 md 导入并渲染到页面）

    - 入口文件一定要写和src/learn.md区别开


    ```js
    const html = require('./hymd.md')
    
    const app = document.createElement('div')
    app.innerHTML = html
    document.body.appendChild(app)
    ```

  - `webpack.config.js`

    ```js
    const path = require('path')
    const HtmlWebpackPlugin = require('html-webpack-plugin')
    
    module.exports = {
      mode: 'development',
      entry: './src/index.js',
      output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js',
        clean: true
      },
      module: {
        rules: [
          {
            test: /\.md$/,
            use: [path.resolve(__dirname, './hy-loaders/hymd-loader.js')]
          }
        ]
      },
      plugins: [
        new HtmlWebpackPlugin({
          title: 'md-loader demo'
        })
      ]
    }
    ```

  - 验证方式
    - 执行 `pnpm run build`
    - 打开 `build/index.html`，页面会渲染出 `src/hymd.md` 的内容


### 优化md里面代码在网页显示效果

- 安装css编译器
  - 命令

    ```bash
    pnpm add -D style-loader css-loader
    ```


- 安装highlight.js

  - 命令

    ```bash
    pnpm add highlight.js
    ```

  - 作用
    - 用于代码高亮（把 md 代码块渲染成带 class 的高亮 html）
    - 再配合它自带的主题 css，让页面代码块显示更好看


- 使用

  - webpack.config.js添加

    ```js
    module: {
      rules: [
        {
          test: /\.md$/,
          use: [path.resolve(__dirname, './hy-loaders/hymd-loader.js')]
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    }
    ```

  - src/css/style.css

    - 自己对代码样式的优化
      - 即require('./css/style.css')
  
    - 或者使用已有的会对md里面代码高亮的样式
      - 即require('highlight.js/styles/github-dark.css')
  
  
    ```css
    pre {
      padding: 12px;
      background: #0b1020;
      border-radius: 8px;
      overflow: auto;
    }
    
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
      font-size: 13px;
    }
    ```
  
  - 在入口文件中引入样式（`src/index.js`）
  
    ```js
    const html = require('./hymd.md')
    
    require('./css/style.css')
    require('highlight.js/styles/github-dark.css')
    
    const app = document.createElement('div')
    app.innerHTML = html
    document.body.appendChild(app)
    ```

#### 问题： 不行：hy-loaders/hymd-loader.js

```js
const { marked } = require('marked')
const hljs = require('highlight.js')

marked.setOptions({
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  }
})

module.exports = function (content) {
  const html = marked.parse(content)
  return `module.exports = ${JSON.stringify(html)}`
}
```

- 原因：旧方式：marked 内部 highlight 机制不稳定，经常不生成 class（（版本兼容坑））

- 解决

  - 自己重写 `renderer.code`，等于完全接管了代码块的渲染，100% 自己控制，不会乱

  - 下面的 // **正确调用 highlight.js 高亮**  作用

    - 它会**扫描这段 JS 代码**，识别出：

      - 注释 `// ...`
      - 关键字 `function` / `return`
      - 变量 `module` / `console`
      - 字符串 `'normal...'`

      然后**自动给它们套上 `<span class="hljs-xxx">`**

    - 然后他会**打印3次**，因为上面的`src/hymd.md`有3个（1个css语言类型，2个js语言类型）

  ```js
  const { marked } = require('marked')
  const hljs = require('highlight.js')
  
  const renderer = new marked.Renderer()
  
  renderer.code = function (tokenOrCode, infostring) {
  	// **正确拿到代码内容**
    const code = typeof tokenOrCode === 'string' ? tokenOrCode : (tokenOrCode?.text ?? '')
    
    // **正确拿到语言类型**
    const lang = typeof tokenOrCode === 'string'
      ? (infostring || '').trim()
      : ((tokenOrCode?.lang || '').trim())
  
    // **正确调用 highlight.js 高亮**
    const highlighted = lang && hljs.getLanguage(lang)
      ? hljs.highlight(code, { language: lang }).value
      : hljs.highlightAuto(code).value
    console.log(highlighted,'hightlisghte')
  
    // **正确拼出带 class 的 HTML：`class="hljs language-js"`**
    const safeLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
    return `<pre><code class="hljs language-${safeLang}">${highlighted}</code></pre>`
  }
  
  marked.setOptions({
    renderer
  })
  
  module.exports = function (content) {
    const html = marked.parse(content)
    console.log('html',html)
  
    return `module.exports = ${JSON.stringify(html)}`
  }
  ```







# 三。自定义Plugin

- tapable 是 webpack 内部用来实现插件系统的核心库（`compiler.hooks.xxx.tap(...)` 就是基于它封装出来的）。

## 3.1. 介绍tapable

### 分类

- 同步
  - 比如：`SyncHook`、`SyncBailHook`、`SyncWaterfallHook`、`SyncLoopHook`
- 异步
  - 比如：`AsyncParallelHook`（并行）、`AsyncSeriesHook`（串行）
  - 异步 hook 的订阅方式通常有三种：
    - `tapAsync`（回调风格）
    - `tapPromise`（Promise 风格）
    - `tap`（仅对同步 hook 使用）

补充：tapable 是 webpack 内部用来实现插件系统的核心库（`compiler.hooks.xxx.tap(...)` 就是基于它封装出来的）。





## 3.2.Hooks的使用

- 安装tapable

  - 命令

    ```bash
    pnpm add tapable
    # 或 npm i tapable
    ```

  

### 同步hook的使用

#### 基本使用

- 设置文件: hooks/tapable-同步基本使用.js

  目标：用 `SyncHook` 跑通一次“注册监听 -> 触发 hook -> 依次执行回调”。

  ```js
  // hooks/tapable-同步基本使用.js
  const { SyncHook } = require('tapable')
  
  class Lesson {
    constructor() {
      this.hooks = {
        hyhook: new SyncHook(['name', 'age']) // hyhook是自定义名字
      }
    }
  
    register() {
      this.hooks.hyhook.tap('pluginA', (name, age) => {
        console.log('pluginA start', name, age)
      })
  
      this.hooks.hyhook.tap('pluginB', (name, age) => {
        console.log('pluginB start', name, age)
      })
    }
  
    run() {
      setTimeout(() => {
        this.hooks.hyhook.call('mjl', 18)
      }, 1000)
    }
  }
  
  const lesson = new Lesson()
  lesson.register()
  lesson.run()
  ```

  运行验证：

  ```bash
  node hooks/tapable-同步基本使用.js
  ```

  预期输出（顺序执行）：

  ```bash
  pluginA hyhook mjl 18
  pluginB hyhook mjl 18
  ```




#### bail

- 作用

  `SyncBailHook`：按注册顺序执行监听函数；**只要有一个监听函数返回了非 `undefined` 的值，就会“保险退出（bail）”**，后续监听函数（比如pluginB)不再执行。

- 使用

  ```js
  const { SyncBailHook } = require('tapable')
  
  class Lesson {
    constructor() {
      this.hooks = {
        hyhook: new SyncBailHook(['name'])
      }
    }
  
    register() {
      this.hooks.hyhook.tap('pluginA', (name) => {
        console.log('pluginA', name)
        return 'stop'
      })
  
      this.hooks.hyhook.tap('pluginB', (name) => {
        console.log('pluginB', name)
      })
    }
  
    run() {
      setTimeout(() => {
        const result = this.hooks.hyhook.call('mjl')
        console.log('result', result)
      }, 1000)
    }
  }
  
  const lesson = new Lesson()
  lesson.register()
  lesson.run()
  ```
  
  - 运行验证

    ```bash
    node hooks/tapable-bailhook.js
    ```
  
  - 预期输出

    ```bash
    pluginA mjl
    result stop
    ```


#### loop

- 作用

  `SyncLoopHook`：按注册顺序执行监听函数；如果某个监听函数**返回非 `undefined`**，会让它（以及整个 hook）**重新从头再跑一轮**。直到本轮所有监听函数都返回 `undefined`，才会结束。

  - 要是没有返回undefined，他就会循环执行第一个监听函数不会停

- 使用

  - 新建文件：`hooks/tapable-loop.js`

    ```js
    const { SyncLoopHook } = require('tapable')
    
    class Lesson {
      constructor() {
        this.hooks = {
          hyhook: new SyncLoopHook(['name'])
        }
        this.countA = 0
      }
    
      register() {
        this.hooks.hyhook.tap('pluginA', (name) => {
          this.countA++
          console.log('pluginA', this.countA, name)
          if (this.countA < 3) return true
          return undefined
        })
    
        this.hooks.hyhook.tap('pluginB', (name) => {
          console.log('pluginB', name)
          return undefined
        })
      }
    
      run() {
        setTimeout(() => {
          this.hooks.hyhook.call('mjl')
        }, 1000)
      }
    }
    
    const lesson = new Lesson()
    lesson.register()
    lesson.run()
    ```

  - 预期输出（示意）

    ```bash
    pluginA 1 mjl
    pluginA 2 mjl
    pluginA 3 mjl
    pluginB mjl
    ```


#### waterfall

- 作用

  `SyncWaterfallHook`：瀑布流。第一个监听函数拿到初始参数；后续监听函数会拿到**上一个监听函数的返回值作为新的参数**（如果上一个返回 `undefined`，则沿用上一次的参数）。

- 使用

  - 新建文件：`hooks/tapable-waterfall.js`

    ```js
    const { SyncWaterfallHook } = require('tapable')
    
    class Lesson {
      constructor() {
        this.hooks = {
          hyhook: new SyncWaterfallHook(['data','age'])
        }
      }
    
      register() {
        this.hooks.hyhook.tap('pluginA', (data,age) => {
          console.log('pluginA', data, age)
          return data + ' A'
        })
    
        this.hooks.hyhook.tap('pluginB', (data,age) => {
          console.log('pluginB', data,age)
          return data + ' B'
        })
      }
    
      run() {
        setTimeout(() => {
          const result = this.hooks.hyhook.call('start', '18')
          console.log('result', result)
        }, 1000)
      }
    }
    
    const lesson = new Lesson()
    lesson.register()
    lesson.run()
    ```

  - 运行验证

    ```bash
    node hooks/tapable-waterfall.js
    ```

  - 预期输出

    ```bash
    pluginA start 18
    pluginB start A 18
    result start A B
    ```
    
    - result start A B 后面没有18，因为result是返回值 即 return data + ' B' 这里没age



### 异步使用

#### parallet

- 作用

  `AsyncParallelHook`：并行执行异步任务。

  - 所有监听函数都完成（都调用了 `callback` / 或 resolve）后，才会进入最终的 `callAsync` 回调。
  - 并行的特点：**pluginA/pluginB 谁先完成不确定**，取决于各自异步耗时。
- 使用

  - 新建文件：`hooks/tapable-async-parallel.js`

    - callAsync 和 tapAsync
  
    - 这里可以不使用callback，但下面的series必须使用callback，因为要靠callback串起来
  
  
    ```js
    const { AsyncParallelHook } = require('tapable')
    
    class Lesson {
      constructor() {
        this.hooks = {
          hyhook: new AsyncParallelHook(['name'])
        }
      }
    
      register() {
        this.hooks.hyhook.tapAsync('pluginA', (name, callback) => {
            console.log('pluginA', name)
            // callback()
        })
    
        this.hooks.hyhook.tapAsync('pluginB', (name, callback) => {
            console.log('pluginB', name)
            // callback()
        })
      }
    
      run() {
        setTimeout(() => {
          this.hooks.hyhook.callAsync('mjl')
        }, 1000)
      }
    }
    
    const lesson = new Lesson()
    lesson.register()
    lesson.run()
    ```
  
  - 运行验证
  
    ```bash
    node hooks/tapable-async-parallel.js
    ```
  
  - 预期输出（顺序不固定，done 一定最后）
  
    ```bash
    pluginB mjl
    pluginA mjl
    done
    ```



#### series

- 作用
  - 思想由于是串行，所以需要个东西串起来。那个东西就是’callback‘

  `AsyncSeriesHook`：串行执行异步任务。

  - 只有当前监听函数调用了 `callback`，才会进入下一个监听函数。
  - 串行的特点：输出顺序固定（先 A 再 B）。
- 使用

  - 新建文件：`hooks/tapable-async-series.js`

    ```js
    const { AsyncSeriesHook } = require('tapable')
    
    class Lesson {
      constructor() {
        this.hooks = {
          hyhook: new AsyncSeriesHook(['name'])
        }
      }
    
      register() {
        this.hooks.hyhook.tapAsync('pluginA', (name, callback) => {
          setTimeout(() => {
            console.log('pluginA', name)
            callback()
          }, 1000)
        })
    
        this.hooks.hyhook.tapAsync('pluginB', (name, callback) => {
          setTimeout(() => {
            console.log('pluginB', name)
            callback()
          }, 500)
        })
      }
    
      run() {
        setTimeout(() => {
          this.hooks.hyhook.callAsync('mjl', () => {
            console.log('done')
          })
        }, 1000)
      }
    }
    
    const lesson = new Lesson()
    lesson.register()
    lesson.run()
    ```

  - 运行验证

    ```bash
    node hooks/tapable-async-series.js
    ```

  - 预期输出（顺序固定）

    ```bash
    pluginA mjl // 1000ms后打印
    pluginB mjl // 1500ms后打印
    done
    ```



