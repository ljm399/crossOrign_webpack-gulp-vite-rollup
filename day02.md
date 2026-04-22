# 一。babel核心用法

## 1.1. 浏览器兼容性问题（历史）

- 问题：要一边写代码，还要考虑浏览器兼容问题

- 需求：需要对 JS/CSS 做兼容性处理的工具链

  - postcss 将新css和浏览器前缀 转为 部分浏览器兼容

  - babel 将 javascript/（es6~es13）=》 部分浏览器兼容版本

- 问题：但大部分浏览器已经支持很多新语法，如何避免“为了少量旧环境”而做过多转换（减少不必要的编译/产物体积）

  - 思路：通过配置“目标运行环境”，让工具只做必要的转换（这里先不展开 targets/stage-x 细节）

    ```js
      options: {
        presets: [['@babel/preset-env', { targets: '>0.2%' }]]
      }
    ```

    

  

## 1.2.解决浏览器兼容性问题

- 面试回答：现在没有手动写兼容代码了比如ws-tik，而是配置好自动工程化
  - 回答关键词
    - browerList
    - caniuse
    - Babel
    - postcss

- browserslist 工具

  - 你配置好规则后，各种工具（如 Babel、autoprefixer）会读取该规则来计算“需要支持哪些浏览器/版本”

    - 即你执行
      - npx webpack时会先去.browserslistrc看，再解析编译
  - 它们通常使用本地的兼容性数据（来源于 caniuse 数据库的离线数据包），而不是运行时去访问 caniuse.com

  - **配置位置**（常见）
    
    - `.browserslistrc`
    - 或 `package.json` 里的 `browserslist`
    
  - 有些脚手架/模板会预置默认规则；但如果你想让兼容范围可控，建议显式写出来

    ```txt
    > 1%
    last 2 versions
    not dead
    ```

    - browserslistrc文件里面就是上面这样

  - 解释
    - `> 1%`
      - 表示只考虑“全球使用率 > 1%”的浏览器版本范围
      - **测试：当你写>10%时，则let，const这些es6语法不会转换，因为>10%的浏览器都支持es6语法**
        - 可能1%目标浏览器都支持”
          - 测试可以写 ie11到browserslistrc，就会发现const 转 var
    - `last 2 versions`
      - 表示每个浏览器只支持其最新的 2 个版本
    - `not dead`
      - 排除那些被兼容性数据标记为“已停止维护/不再更新”的浏览器版本
    
  - 另外还有其他属性（了解）
    - `ios >= 9`
      - 表示需要支持 iOS Safari 9 及以上
    - `ios >= 7`
      - 表示需要支持 iOS Safari 7 及以上
    - `ie >= 11`
      - 表示需要支持 IE 11 及以上
    - `firefox >= 100`
      - 表示需要支持 Firefox 100 及以上
    - `since 2020-01-01`
      - 表示只考虑从某个日期之后发布的浏览器版本
    - `supports es6-module`
      - 表示只选择“支持 ES Modules”的浏览器版本（常用于输出现代构建产物）

- targets

  - 作用
    - babel 的 `@babel/preset-env` 可以通过 `targets` 指定需要兼容的运行环境
  - 和 browserslist 的关系
    - 当你在 `@babel/preset-env` 里显式配置了 `targets` 时，会覆盖（或说优先生效于）browserslist 计算出来的目标范围
    - 如果你没有显式写 `targets`，Babel 往往会去读取 browserslist 配置作为默认目标范围
  - 为什么一般建议统一用 browserslist
    - PostCSS（常见是 autoprefixer）通常也是读取 browserslist 来决定加哪些前缀
    - 如果你在 Babel 里单独写了 `targets`，但 CSS 还是走 browserslist，可能出现“JS 兼容范围”和“CSS 兼容范围”不一致
    - 所以更推荐：把“兼容范围”统一写在 browserslist（单一事实来源），Babel/PostCSS 都读它

- stage-x

  - 再babel7之后就不推荐使用了
  
  - 是什么（了解）
    - 早期 Babel 生态里常见的写法，来自 TC39 的“提案阶段（stage 0~4）”概念，用来表示某个新语法提案的成熟度
    - stage-4成熟度最高
  
  - 为什么现在不常用
    - `preset-stage-x` 这类 preset 已经过时/不推荐
    - 现在更常见的是按需使用具体的 proposal 插件（`@babel/plugin-proposal-xxx`）
      - 但现在都是使用preset，所以过时了
  
  - 示例（结构示意）
  
    ```js
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env'],
        plugins: ['@babel/plugin-proposal-xxx']
      }
    }
    ```
  



## 1.3.babel的配置文件

- babel.config.js

  - ```js
    module.exports = {
    	presets: [
    		["@babel/preset-env"]
    	]
    }
    ```

  - webpack.config.js

    ```js
    use: {
      loader: 'babel-loader',
    }
    ```

- .babelrc.json

  - 已经淘汰，老项目中可以看到
  - 不支持Monorepos项目的子包（babel.config.js支持）
    - Monorepos可以同时管理后端和前端代码



## 1.4.babel和polyfillshiyon

### polyfill作用

- polyfill 解决的是“API/内置对象缺失”的兼容问题
  - 例：`Promise`、`Array.prototype.includes`、`Object.assign`
  - 这些属于运行时能力：旧浏览器/旧 Node 没有就会直接报错
- babel 主要负责“语法转换”，不会凭空提供这些 API
- 理解：polyfill 相当于“补丁/垫片”
  - 在环境缺失某个 API 时，注入一段实现（或模拟实现），让同名 API 可用

#### polyfill的使用

- 命令
  - npm i core-js regenerator-runtime

 - 配置示意（以 `@babel/preset-env` 为例）

   ```js
   presets: [
     [
       '@babel/preset-env',
       {
         // targets: '...', // 或者交给 browserslist
         corejs: 3,
         useBuiltIns: 'usage' // 'usage' | 'entry' | false
       }
     ]
   ]
   ```

 - `useBuiltIns`
   
   - 注意：polyfill意思是“补丁库”
   
     - 补丁库里面内嵌了很多方法
   
   - `false`
   
     - 不自动处理 polyfill（只做语法转换）
   
   - `entry`

     - 你需要在入口文件手动 `import` polyfill 入口（相当于先“全局兜底”）
   
       - polyfill意思就是导入下面的
   
         - main.js
   
         ```\
         import 'core-js/stable'
         import 'regenerator-runtime/runtime'
         ```
   
     - 然后 Babel 根据targets/browserslist裁剪，然后把需要的 polyfill 打进打包产物
   
     - 适合：担心第三方依赖里也用了新 API（更稳，但通常会比 usage 更“多引一点”）
   
     - 比如main.js
   
       ```js
       import 'core-js/stable'
       import 'regenerator-runtime/runtime'
       ....
       ```
   
   - `usage（最常用）`
   
     - Babel 扫描“被它处理到的代码”用到了哪些新 API，并自动按需注入 polyfill
     - 优点：更精细（只引你用到的）
     - 注意：如果某些第三方依赖没有经过 Babel 处理，依赖内部的用法不一定都能被扫描到
   
- `corejs` 是什么

  - `core-js` 是一个 polyfill 库，里面实现了很多 ES 新增的 API/内置对象能力（如 `Promise`、`includes`、`Object.assign` 等）
  - Babel 在做“按需注入 polyfill”时，需要你声明 `corejs` 版本
    - 一般 corejs：3就行

### 只有上面代码会报错

- 解决

  - babel.config.js

    ```
    module.exports = {
        presets: [['@babel/preset-env', {
            targets: {
            //    browsers: ['> 1%', 'last 2 versions','not dead'],
            ie: '11'
            },
            modules: 'commonjs', -- 添加
            corejs:3,
            useBuiltIns:'usage'
        }]]
    };
    ```

  - webpack.config.js

    ```
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/, -- 添加
                    use: {
                        loader: 'babel-loader',
                    }
                }
            ]
        }
    ```

#### 

#### commjs那个

我把链路按 Babel 的真实工作方式说清楚：

###### 1) Babel 处理 [src/index.js](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/03_babel%E7%9A%84%E6%A0%B8%E5%BF%83%E7%94%A8%E6%B3%95/src/index.js:0:0-0:0) 的基本流程
当 webpack 遇到 [src/index.js](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/03_babel%E7%9A%84%E6%A0%B8%E5%BF%83%E7%94%A8%E6%B3%95/src/index.js:0:0-0:0)，会把它交给 `babel-loader`，然后 Babel 大致做：

- **Parse（解析）**  
  把源码字符串解析成 **AST（抽象语法树）**
- **Transform（转换）**  
  根据插件/`preset-env` 对 AST 做改写  
  例如把箭头函数、`const` 等按目标环境需要降级
- **Generate（生成）**  
  把转换后的 AST 再生成回 **新的 JS 代码字符串**（这就是“编译结果”）

所以你说的 “拿到 AST” 是对的，但“编译结果”通常指 **Generate 出来的那份代码**，不是 AST 本身。

---

###### 2) 导入`import "core-js/..."` 
当你配置了：

- `useBuiltIns: 'usage'`
- `corejs: 3`
- 且 `targets` = IE11

`@babel/preset-env` 会在 Transform 阶段做两件事：

- **检查目标环境能力**：IE11 不支持 `includes`
- **扫描你的代码用法**：看到你写了 `stringa.includes(...)`

于是它会在 AST 的顶部 **插入一个“导入 polyfill 模块”的节点**，最终生成代码时就表现为：

- ESM 形式：`import "core-js/modules/es.string.includes.js";`
- 或 CommonJS 形式（我们后来加了 `modules: 'commonjs'`）：`require("core-js/modules/es.string.includes.js");`

---

###### 3) 你之前看到的“开头加了一句”在哪一层？
这里的“开头加了一句”说的是：

- **Babel 输出给 webpack 的那份代码字符串**的开头（也就是 babel-loader 处理后的代码）
- 不是你原始 [src/index.js](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/03_babel%E7%9A%84%E6%A0%B8%E5%BF%83%E7%94%A8%E6%B3%95/src/index.js:0:0-0:0) 的开头
- 也不是 AST 的“开头”（虽然本质上是往 Program body 的前面插入节点）

webpack 再拿到这份“编译后的代码”，继续做模块打包，最后输出到 `dist/bundle.js`。





#### `exclude: /node_modules/` 这一步到底在干什么？

它的目的很简单：**限制 `babel-loader` 的处理范围**。

你的 rule 是：

```js
{
  test: /\.jsx?$/,
  exclude: /node_modules/,
  use: { loader: 'babel-loader' }
}
```

webpack 的意思是：

- **凡是匹配 `test: /\.jsx?$/` 的 JS 文件**，默认都可能走 babel-loader
- 但如果这个文件路径在 `node_modules` 里，就 **跳过**（不交给 Babel）

---

##### 为什么要跳过 `node_modules`？

##### 1) 让 Babel 只编译你写的业务代码
你的业务代码（[src/index.js](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/03_babel%E7%9A%84%E6%A0%B8%E5%BF%83%E7%94%A8%E6%B3%95/src/index.js:0:0-0:0)）才是你要做语法降级、按需 polyfill 的对象。

而 `node_modules` 里的代码（比如 `core-js`、`regenerator-runtime`、各种第三方库）通常已经：
- 发布时就做好了兼容处理（或者提供了多种构建产物）
- 或者它本身就是 polyfill/运行时代码（例如 `core-js`），你再编译它意义不大

##### 2) 性能：不然会非常慢
`node_modules` 里 JS 文件数量巨大。你不排除它，babel-loader 可能要处理成千上万的文件：

- **构建时间大幅变长**
- **缓存命中率变差**

##### 3) 正确性：避免“二次编译”导致意外
有些依赖包的代码结构比较特殊，或者依赖特定的 module 格式：

- 你用 Babel 再转一遍，可能把它从 ESM 转成 CJS（或反过来），导致 tree-shaking 失效、或者打包结果异常
- 也可能因为某些依赖用到了你没配置的 Babel 语法插件，导致编译失败

特别是像 `core-js` 这种库：它本身就是一堆模块文件，你再用 Babel 去处理，很容易出现“编译了不该编译的东西”的麻烦。

---

##### 那我什么时候**不**排除 `node_modules`？

少数场景会“选择性编译”某些依赖（而不是全量编译）：

- 某个第三方库发布的代码太新（比如包含可选链、nullish coalescing），而你的目标环境又很老
- 这时会写成类似逻辑：**只 include/只处理某几个包**

但默认最佳实践就是：

- **编译 `src`**
- **排除 `node_modules`**

---

##### 总结

- 你加的 `exclude: /node_modules/` 的核心作用：**让 Babel 只处理你的源码，避免处理依赖包**



## 1.5.babel对react的支持

- 安装react命令
  - ```bash
    npm i react react-dom
    ```

- webpack + babel相关依赖

  - ```bash
    npm i -D webpack webpack-cli html-webpack-plugin
    npm i -D babel-loader @babel/core @babel/preset-env @babel/preset-react
    ```

- babel.config.js配置

  - ```js
    module.exports = {
      presets: ['@babel/preset-env', '@babel/preset-react']
    };
    ```

- react/app.jsx

  - ```jsx
    import React from 'react';
    export default function App() {
      return <div>Hello React</div>;
    }
    ```
    
    - import React from 'react';
    
      - 这段代码虽然明面上没用到，但 **JSX 编译后会用到 `React` 变量**
    
    - 要是希望“全项目都不写 React import”
    
      - #### 为什么 `import React from 'react'` 没用到，但不写会报错？
    
        这取决于你用的 **JSX 转换方式**（Babel/TS 把 JSX 编译成什么）。
    
        ##### 1) 旧的 JSX 转换（React 17 之前的经典方式）
        在这种模式下，JSX：
    
        ```jsx
        <div>Hello</div>
        ```
    
        会被编译成：
    
        ```js
        React.createElement("div", null, "Hello");
        ```
    
        也就是说：**你虽然源码里没写 `React`，但编译后的代码会用到 `React` 变量**。
    
        所以如果文件里没有：
    
        ```js
        import React from 'react';
        ```
    
        运行时就会报：
    
        - `React is not defined`
    
        ##### 2) 新的 JSX 转换（React 17+ 的 automatic runtime）
        如果配置成新方式，JSX 会编译成从 `react/jsx-runtime` 引入的函数调用（不再依赖 `React` 变量），这时**就不需要**手写 `import React` 了。
    
        ---
    
        ##### 为什么你现在会需要它？
    
        你项目里用的是 **Babel + `@babel/preset-react`**。如果 preset-react 没显式配置 `runtime: "automatic"`，很多情况下默认仍可能走“经典 runtime”，于是就需要 `import React`。
    
        你可以用两种方式解决：
    
        - **方式 A（简单）**：像你现在一样，在每个 JSX 文件顶部写 `import React from 'react'`（兼容最强）
    
        - **方式 B（推荐，现代）**：把 Babel 配置成 automatic runtime，这样就不用手写 import 了  
    
          ```js
          babel.config.js
          module.exports = {
              presets: [....., ['@babel/preset-react', { runtime: 'automatic'或'classic' }]] // 不写默认是runtime：'runtime'
          };  
          ```
    
        #### 总结
    
        - 你现在必须写 `import React from 'react'`，是因为 **JSX 编译后会用到 `React` 变量**（经典 JSX runtime）。
    
        

- 导入src/index.js

  - ```js
    import React from 'react';
    import ReactDOM from 'react-dom';
    import App from './react/app';
    
    ReactDOM.render(<App />, document.getElementById('root'));
    ```

- 设置index.html让react可以渲染

  - ```html
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>React + Babel</title>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
    ```

- webpack.config.js配置

  - 使用刚刚安装的HtmlWebpackPlugin
    
  - 配置（示意）
  
    ```js
    const path = require('path');
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    
    module.exports = {
      entry: './src/index.js',
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true
      },
      resolve: {
        extensions: ['.js', '.jsx']
      },
      module: {
        rules: [
          {
            test: /\.(js|jsx)$/,--- 或 /\.(jsx?)$/
            exclude: /node_modules/,
            use: 'babel-loader'
          }
        ]
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: './public/index.html'
        })
      ]
    };
    ```
    
    -   resolve: {extensions: ['.js', '.jsx' },作用:
    
      - #### 解决问题： `Can't resolve './react/index'`？
    
        因为你真实文件是：
    
        - src/react/index.jsx
    
        但你在 src/index.js 里写的是：
    
        - `import App from './react/index'`
    
        webpack 默认解析扩展名通常是：
    
        - `.js`
        - `.json`
        - `.wasm`
    
        它**不会自动去找 `.jsx`**
    
        - 你添加了jsx就可以解析了
    
        
  
- react打包成功后，在打包文件夹中有个index.html可以运行
  - 你把打包后的文件夹部署到服务器，服务器就是拿里面的index.html去渲染

- 编译命令

  - ```bash
    npx webpack --mode production
    ```



#### 报错：_reactDom.default.render is not a function

- 因为npm i react react-dom默认安装时18

  - 上面的是17，所以报错

    ```
    import ReactDOM from 'react-dom';
    import App from './react/app';
    
    ReactDOM.render(<App />, document.getElementById('root'))
    ```

  - 解决

    ```js
    import { createRoot } from 'react-dom/client'
    createRoot(...).render(<App />)
    ```

    

### 已经24岁了，你要知道你现在没什么理由要钱的了，之后多少钱全靠现在的能力了



## 1.6. webpack对typerscript支持

### ts-loader

- 会进行类型检查，类似于polyfill无能为力

- 安装ts和对应编译器
  - 命令
    - ```bash
      npm i -D typescript ts-loader
      ```
- ts/index
  - 代码
    - ```ts
      export const add = (a: number, b: number) => a + b;
      ```
- 导入index.js
  - 代码
    - ```js
      import { add } from './ts/index.ts';
      
      console.log(add(1, 2));
      ```
- 修改webpack.config.js的rules
  - 代码
    - ```js
      module: {
        rules: [
        	{
              test: /\.(js|jsx)$/,--- 或 /\.(jsx?)$/
              exclude: /node_modules/,
              use: 'babel-loader'
        	}，
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: 'ts-loader'
          }
        ]
      },
      resolve: {
        extensions: ['.ts', '.tsx', '.js']
      }
      ```
- 创建tsconfig.json
  - ```bash
    npx tsc --init
    ```
  - 不执行编译ts代码会报错
- 打包
  - ```bash
    npx webpack
    ```



#### 报错

##### 报错原因（TS1287）

你现在 [tsconfig.json](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/03_babel%E7%9A%84%E6%A0%B8%E5%BF%83%E7%94%A8%E6%B3%95/tsconfig.json:0:0-0:0) 里是：

- `"module": "nodenext"`
- `"verbatimModuleSyntax": true`

在这种组合下，TypeScript 会对 ESM/CJS 边界非常严格：它把当前文件判定成 **CommonJS** 时，就不允许你写这种顶层导出：

```ts
export const add = ...
```

于是报：

- `A top-level 'export' modifier cannot be used on value declarations in a CommonJS module when 'verbatimModuleSyntax' is enabled.`

这和 webpack 打包场景不太匹配（webpack 更希望你输出 ESM 让它来打包）。

#### 我已经帮你改了 [tsconfig.json](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/03_babel%E7%9A%84%E6%A0%B8%E5%BF%83%E7%94%A8%E6%B3%95/tsconfig.json:0:0-0:0)

我做了 3 个调整（都是为了 “webpack + ts-loader” 的典型配置）：

- **`module: "ESNext"`**  
  让 TS 输出 ESM，交给 webpack 做 bundling
- **`verbatimModuleSyntax: false`**  
  关闭这条严格限制，避免 TS1287
- **关闭声明文件输出**：`declaration/declarationMap: false`  
  不然你会看到 webpack 构建时“额外生成 .d.ts 资源”（你之前已经看到 `index.d.ts` 被 emit 了）



#### tsconfig.json里面的verbatimModuleSyntax是什么？

核心作用是**强制保留源码中 `import/export` 的原始写法，不做额外转换**，同时严格要求**显式标记类型导入 / 导出**（如 `import type`）TypeScript。

##### 核心作用与行为

1. **严格区分类型与值**

   - 启用后，**未标记 `type` 的导入 / 导出会被保留**（不会在编译时被移除）；

   - 仅 `import type`/`export type` 标记的内容会被完全擦除

     ，用于类型安全，避免运行时残留TypeScript。示例：

   ```ts
   // 完全擦除（仅类型）
   import type { User } from "./types";
   // 保留（值 + 类型混合，类型部分会被移除）
   import { print, type User } from "./utils";
   // 保留（纯值，不会被移除）
   import { fetchData } from "./api";
   ```

2. **原样保留模块语法**

   - 不自动转换 `import/export` 的格式（如不会将 ESM 语法转为 CommonJS 的 `require`）；

   - 要求输入代码的模块语法与目标输出格式一致（如输出 ESM 时，源码必须写 ESM 语法；输出 CommonJS 时，需用 

     ```
     import fs = require("fs")
     ```

      等 CJS 风格语法）。

     常见场景：

   - 面向 Node.js ESM 项目：强制使用 ESM 语法，输出与源码一致；

   - 混合 ESM/CommonJS 项目：需按目标格式分别编写，避免跨格式转换导致的兼容问题。

#### 为什么需要它？

- **解决类型导入歧义**：旧版 TypeScript 会自动识别并移除类型导入，但若导入模块存在**副作用**，可能导致运行时异常；
- **提升可预测性**：明确标记类型，让代码更易维护，避免编译时意外移除 / 保留导入 / 导出；
- **兼容 ESM 规范**：适合开发 Node.js ESM 库或工具，确保输出符合 ESM 标准，减少跨环境兼容问题。



### babel-loader

- 优点
  - 可以使用polyfill
  - 不用额外安装ts-loader，babel-loader本身就支持ts编译（缺点不会做类型检查）

- 操作步骤
  - 修改webpack.config.js

    - ```js
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: 'babel-loader'
          }
        ]
      },
      resolve: {
        extensions: ['.ts', '.tsx', '.js']
      }
      ```

  - 安装ts有关预设
    - ```bash
      npm i -D @babel/preset-typescript
      ```

  - babel.config.js
    - ```js
      module.exports = {
        presets: ['@babel/preset-env', '@babel/preset-typescript']
      };
      ```

#### 报错

报错文件是 [./src/ts/index.ts](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/03_babel%E7%9A%84%E6%A0%B8%E5%BF%83%E7%94%A8%E6%B3%95/src/ts/index.ts:0:0-0:0)，代码里有 TypeScript 语法：

```ts
(a: number, b: number)
```

但是你现在的 [webpack.config.js](cci:7://file:///c:/Users/MJL/Desktop/17_webpack-gulp-vite-rollup/03_babel%E7%9A%84%E6%A0%B8%E5%BF%83%E7%94%A8%E6%B3%95/webpack.config.js:0:0-0:0) 里：

- Babel 规则只处理 `test: /\.jsx?$/`（只管 `.js/.jsx`）

- 解决

  - 办法一

  ```js
          rules: [
              {
                  test: /\.[jt]sx?$/,  // 同时处理 `.js/.jsx/.ts/.tsx`
                  exclude: /node_modules/,
                  use: {
                      loader: 'babel-loader',
              },
  ```

  - \.      匹配一个点 . 

  - [jt]    匹配 j 或 t 其中一个字符	

  

  - 办法二（不会正则时）

    ```js
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: 'babel-loader'
                }
    ```

    



### 两者区别

- babel-loader

  - 和ts-loader一样都支持语法转换如ts转js
  - 同时支持使用ployfill（ts-loader不行）
  - 缺点：不可以类型检查（但ts-loader可以）

- 各有优缺点，所以结合使用

  - package.json添加代码来使用ts来类型检查

    ```js
    script:{ 
    	'tsc-check':'tsc --noEmit', 这个可以省，只用下面那一个就可以
    	'tsc-check':'tsc --noEmit --watch', -- 作用实时检查你码字时有无类型问题
    }
    ```

  - 打包代码使用babel-loader



# 二。 webpack的server

## 2.1.搭建webpack本地服务器：webpack-dev-server

- 本地没有创建任何文件，而是将运行代码放在内存中，所以运行效率高
  - 因为不放文件中，省去了文件读取步骤

- 安装命令

  - ```
    npm i webpack-dev-server -D
    ```

- package.json配置

  - "serve": 'webpack server '  
    - 可以自定义配置文件，而不是只能在webpack.config.js
    - "serve": 'webpack server --config wk.config.js'

## 2.2. devServer其他配置信息

- static配置

  - 作用：启动webpack服务器后项目中index.html中静态资源写法更简洁
  - webpack.config.js

    ```js
    devServer:{
    	static:['public','content'] // 默认值时public
    }
    ```

    则 index.html

    ```js
    前提条件：静态资源(如abc.js)在public或刚刚配置的content目录下（public，index.html和src并列）
    <script src=”./abc"> -- 不用加public或content，其自动会去那里找
    ```

    

- 额外配置：
  - host
    - 域名
      - 一般127.0.0.1
      - 当你给同事也可以看到你本地服务器就可以开启 0.0.0.0
        - 同事wift和你在一个wift下或同一个ipv4下
        - 你电脑ipv4是198.168.10.15
        - 同事访问198.168.10.15:9000 就可以看到你的代码了
  - port
    - 端口比如9000
  - compress
    - true 压缩
    - 静态资源不会压缩



## 2.3.devServer里面proxy配置

- 只在开发阶段使用，用于测试和解决跨域问题

- vue/react项目时，基本都会配置

  - 注意只要修改了webpage.config.js,那么就要重新启动webpack服务
  - ```javascript
    devServer: {
        host: '0.0.0.0',
        compress: true,
        port: 9000,
        open: true,
        proxy: [ -- 注意devServer.proxy是个数组
            {
                context: ['/api'],
                target: 'http://localhost:8000',
                // changeOrigin: true,
                pathRewrite: {
                    '^/api': ''
                }
            }
        ]
      }
    },
        
    ---- index.js
    axios.get('api/test').then ---- 一定要写api/，否则匹配不到上面的api就不能实现跨域
    ```
  
    
  - 实现原理：浏览器请求先发给 `webpack-dev-server`（它本身就是一个本地 Node HTTP 服务），再由它把请求转发到 `target` 指定的后端服务器
    - 这不是“额外再开启一个本地 Node 服务”，而是 `webpack-dev-server` 自己在做反向代理
    - 一般可以理解为两端：
      - webpack-dev-server（本地开发服务器 + proxy）
      - 后端服务器、
  
    - 进一步解释
  
      #### 1) 关于 webpack-dev-server “代码住不住在服务器里”
      这部分你说得**基本对**：
  
      - `webpack-dev-server` 的主要作用之一是：
        - **把构建产物放在内存里**
        - **提供 HMR / 自动刷新**
        - **让你开发时能实时看到变化**
      - **它不是“把你的业务代码部署到一台远程服务器上”，而是本机起一个开发 HTTP 服务来提供资源。**
  
      小纠正：你说“代码只是运行在里面”这句容易引起误解。更准确是：
  
      - **JS 源码最终还是在浏览器里执行**（页面逻辑、发起 Ajax/fetch 的代码都在浏览器执行）
      - `webpack-dev-server` 主要负责“把资源（bundle、HMR、静态文件）提供给浏览器 + 提供代理转发能力”
  
      #### 2) 关于 “它怎么实现跨域”
      **不是“你的代码调用 dev-server 去远程拿数据”**，而是“浏览器请求先打到 dev-server，dev-server 再转发”。
  
      更准确的链路是：
  
      - **浏览器里的前端代码**发请求：`fetch('/api/user')`
      - 浏览器会把它请求到**当前页面同源**：`http://localhost:9000/api/user`
      - `webpack-dev-server` 收到这个请求后，根据 `devServer.proxy`：
        - **转发**到远程/后端：比如 `http://backend.com/user`（可能还会 `pathRewrite`）
      - 后端返回数据给 dev-server
      - dev-server 再把数据返回给浏览器
  
      所以跨域“被解决”的根本原因是：
  
      - 浏览器这一步 **没有跨域**（它请求的是 `localhost:9000` 同源）
      - 跨域那一步变成了 **服务器到服务器通信**（dev-server -> 后端），不受浏览器同源策略限制
  
    
  
  - `pathRewrite: { '^/api': '' }` 解释
  
    - 作用：把请求路径里的 `/api` 前缀去掉后再转发给后端
    - 例：浏览器请求 `GET /api/users`
      - 转发到后端时会变成 `GET /users`
    - 适用场景：
      - 前端想统一用 `/api` 做前缀（方便区分接口请求）
      - 但后端真实路由并没有 `/api` 这个前缀
  





- changeOrigin：true  --- 默认就是true
  - 作用：控制代理在“转发到 `target`”时，是否把请求头中的 `Host` 改成目标后端的 host（某些场景下也会连带影响 `Origin/Referer` 的表现）
  - 重点：无论 `changeOrigin` 是 `true` 还是 `false`，**代理都会把请求转发到 `target`；差别主要在“代理发给后端的请求头长什么样”**
  - 把链路分成两跳理解（理解 proxy 的关键）：
    - 第 1 跳（浏览器 -> webpack-dev-server）
      - 浏览器请求同源地址，例如：`http://localhost:9000/api/users`
      - 这一跳不跨域，所以浏览器不会拦截
    - 第 2 跳（webpack-dev-server -> 后端 target）
      - 代理把请求转发到 `target`，例如：`http://localhost:8000/users`
      - 这一跳是**“服务器到服务器”请求，不受浏览器同源策略限制**
  - `changeOrigin: true`（开发里更常用）
    - 转发到后端时：**`Host` 会被改成目标后端的 host**
      - 例：**`target` 是 `http://localhost:8000`，则发给后端的 `Host` 变成 `localhost:8000`**
    - 常见原因
      - 很多后端/网关会根据 `Host` 做路由（虚拟主机）或做校验；**如果 `Host` 不符合预期，可能返回 403/404**
      - 代理到线上域名（如 `https://api.xxx.com`）时通常都需要 `true`
  - `changeOrigin: false`（少数场景使用）
    - 转发到后端时：**`Host` 往往保持为代理自身的 host**
      - 例：**页面在 `http://localhost:9000`，则发给后端可能还是 `Host: localhost:9000`**
  - 补充：后端（通过Koa/Express/Java 实现）





## 2.4.historyApiFallback 

- 一定要配置为true,因为默认为false，上面的changOrign一样要配置

- 总结：要是为true：404 => localhost：3000/index.html

- 实现过程

  - *SPA 项目里* `/a` *往往只是前端路由，不是真实文件。*

  - 而服务器的/a则是去调用和访问真实文件
    - *开发服务器默认按静态资源处理请求：**当用户刷新* `http://localhost:8000/a`*，浏览器会请求* `GET /a`*，服务器会去找是否存在* `/a` *对应的文件/目录**，找不到就 404。*

  - *配置* `devServer.historyApiFallback: true` *后，如果服务器发现这个路径不是静态资源，就会回退返回* index.html*。*

  - 浏览器拿到 index.html后，前端路由接管，根据 URL /a正确渲染
    - 解释这句
      - **没有 historyApiFallback**：服务器说“你要 `/a` 文件？我没有，404”，浏览器显示404
      - **有 historyApiFallback**：服务器说“我不管你要啥路径，先给你 index.html，剩下交给前端路由决定显示什么”

  ```js
      devServer: {
          host: '0.0.0.0',
          compress: true,
          port: 9000,
          open: true,
          historyApiFallback:true,
          // 跨域
          proxy: [
              {
                  context: ['/api'],
                  target: 'http://localhost:8000',
                  changeOrigin: false,
                  pathRewrite: {
                      '^/api': ''
                  }
              }
          ]
  ```

  

  

  


# 三。webpack性能优化

- 介绍