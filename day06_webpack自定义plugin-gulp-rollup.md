还是得锻炼口  怎么做呢：回顾的一下边说多说吧

# 一。webpack自定义plugin

## 2.1.自定义plugin原理

- 回顾源码
- 插件的注册
- compiler.hooks.xxx.tapAsync



### 回顾源码：options 是怎么“落到” compiler 上的

核心结论：Webpack 会把 `entry/output/module/optimization/...` 这些 **options** 通过一组“内部插件（internal plugins）”的方式 **apply 到 compiler**，从而把“配置”变成“可执行的构建流程”。这一步发生在用户插件 `options.plugins` 遍历之前/过程中（不同版本实现细节不同，但思路一致）。

#### 1）先创建 compiler，并初始化 hooks

- `webpack(options)` -> 创建 `compiler`（`new Compiler(...)`）
- `compiler` （是个类）构造/初始化阶段就会把常用的 `compiler.hooks` 创建好（因为在其constrouct里面的**Tapable 的 Hook** 实例）

#### 2）把 options 拆解为内部插件并 apply

- Webpack 内部会根据配置字段选择性地 new 一些插件，然后执行：
  - `plugin.apply(compiler)`
- 这些内部插件的职责通常是：
  - **把 entry 变成“从哪里开始构建依赖图”的规则**（例如注入入口相关的处理逻辑）
  - **把 output 变成“产物如何命名/输出到哪里/如何组织 chunk/asset”的规则**
  - **把 module.rules 变成“遇到什么模块用什么 loader 去处理”的规则**
  - **把 optimization 等变成“如何分包/压缩/缓存”等阶段性的处理规则**
- **你可以把它理解成：Webpack 并不是直接“读配置然后 if/else 执行”，而是把配置映射成一堆插件去订阅生命周期，在合适阶段被触发。**

#### 3）这些内部插件具体是怎么生效的？

- 内部插件在 `apply(compiler)` 里会做两件典型的事：
  - **订阅 compiler 的 hooks**：`compiler.hooks.xxx.tap(...) / tapAsync(...) / tapPromise(...)`
  - 或者在 `compiler.hooks.thisCompilation/compilation` 里拿到 `compilation`，再去订阅 `compilation.hooks`
- 后续当你调用 `compiler.run()`（本质是tabable）或 `watch`时，Webpack 编译流程内部会在**各阶段** `call/callAsync/promise` 触发这些 hooks，于是内部插件的逻辑被执行，最终产生打包结果。





## 2.2.搭建注册plugin项目

- 安装webpack

  ```bash
  npm i -D webpack webpack-cli
  ```

- 配置webpack.config.js

  ```javascript
  const path = require('path');
  const HtmlWebpackPlugin = require('html-webpack-plugin');
  const AutoUploadWebpackPlugin = require('./plugins/AutoUploadWebpackPlugin');

  module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html'
      }),
      new AutoUploadWebpackPlugin()
    ]
  };
  ```

- 设置打包入口文件（位置一般是src/index.js）

- 安装html-webpack-plugin

  - 命令

    ```bash
    npm i -D html-webpack-plugin
    ```

  - 自动在打包文件中生成个html，作用可以在本地浏览器看效果

- 配置插件：plugins/AutoUploadWebpackPlugin.js

  ```javascript
  const fs = require('fs');
  const path = require('path');
  
  class AutoUploadWebpackPlugin {
    apply(compiler) {
    }
  }
  
  module.exports = AutoUploadWebpackPlugin;
  ```
  
- webpack.config.js导入

  - `const AutoUploadWebpackPlugin = require('./plugins/AutoUploadWebpackPlugin');`

- compiler已经内置好了

  - 只要 `apply(compiler)` 能接收到 `compiler`，说明插件注册成功（后续再在这里 `compiler.hooks.xxx.tapAsync`）

#### 默认导入和{再导入}时导出的样子

```javascript
module.exports.a = a  ---> import {a} // 类比 obj.a = 2,你拿到a就要{a}
module.exports = a  ---> import a 默认导入
```



## 2.3.自动上传静态资源的功能逻辑

### 简述

1. 获取打包后的文件夹
2. 连接远程服务器
3. 删除远程服务器文件中内容
4. 上传文件夹的内容
5. 断开ssh连接
6. cb()



### 必备知识

[插件入口] 在 `webpack.config.js` 的 `plugins` 注册插件：`new AutoUploadWebpackPlugin()`

[插件形态] 插件提供 `apply(compiler)`，webpack 会在启动构建前调用它并把 `compiler` 传入

[Hook 本质] `compiler.hooks / compilation.hooks` 是 Tapable Hook；插件通过 `tap/tapAsync/tapPromise` 订阅

[需要那个hook，看你需求] **自动部署要等产物生成**后所以使用afterEmit

- afterEmit 等 hook 名字可以在官方文档查到：

  https://webpack.js.org/api/compiler-hooks/

[类比] 这些 hooks 就像 Vue/React 里的生命周期：到对应阶段就触发，你只需要提前注册回调

[思维模型] `apply` 只负责“挂钩子”，真正逻辑发生在 hook 回调被触发时

### 实现（注释就是实现步骤）

#### 先完成

- 连接远程服务器

  - 安装ssh（Node里常用 `ssh2`)

    - 命令

      ```bash
      npm i node-ssh
      ```

- 了解this.ssh.putDirectory的参数：recursive和concurrency

  ###### 1. `recursive: true`

  **作用：递归上传子目录和子文件**

  - `true`：会把**本地文件夹里所有的子文件夹、子文件**全部上传到远程服务器
  - `false`：**只上传当前目录下的直接文件，不会上传子目录**（子目录会被忽略）

  **简单说：**

  你要上传整个文件夹（包含里面所有层级的内容），就必须设为 `true`。

  ------

  ##### 2. `concurrency: 10`

  **作用：并发上传数量 = 同时上传 10 个文件**

  - 控制**一次同时上传多少个文件**
  - 默认值通常是 1 或 2，速度很慢
  - 设为 10 就是**并行上传 10 个文件**，大幅提升上传速度

- 实现

```javascript
const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('node-ssh');
const { SSH_CONFIG, PASSWORD, REMOTE_PATH } = require('./config');

class AutoUploadWebpackPlugin {
  constructor() {
    this.ssh = new NodeSSH();
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('AutoUploadWebpackPlugin', (compilation, cb) => {// cb就是callback
      // 1.获取打包后的文件夹 
      const outputPath = compiler.options.output && compiler.options.output.path;
      if (!outputPath) {
        cb();
        return;
      }
      const distPath = path.resolve(outputPath);// 把 webpack 打包输出目录变成绝对路径，方便后续上传文件

      const remotePath = REMOTE_PATH || '/your/remote/path';

      const run = async () => {
        try {
          // 2.链接远程服务器
          await this.connectServer();
          // 3. 删除远程服务器文件中内容
          await this.ssh.execCommand(`rm -rf ${remotePath}/*`);
          // 4. 上传文件夹的内容
          await this.uploadFiles(distPath, remotePath);
        } catch (err) {
          cb(err);
          return;
        } finally {
          // 5. 断开ssh连接
          this.ssh.dispose();
        }

        // 调用callback
        cb();
      };

      run();
    });
  }

  async connectServer() {
    await this.ssh.connect({
      ...(SSH_CONFIG || {}),
      password: PASSWORD
    });
  }

  async uploadFiles(loacalPath, remotePath) {
    if (!loacalPath || !remotePath) return;
    if (!fs.existsSync(loacalPath)) {
      throw new Error(`localPath not found: ${loacalPath}`);
    }

    const status = await this.ssh.putDirectory(loacalPath, remotePath, {
      recursive: true,
      concurrency: 10
    });

    if (!status) {
      throw new Error('uploadFiles failed');
    }

    return status;
  }

}

module.exports = AutoUploadWebpackPlugin;
```

- 设置config.js(放置password)

```javascript
module.exports = {
  SSH_CONFIG: {
    host: 'YOUR_HOST',
    port: 22,
    username: 'YOUR_USERNAME'
  },
  PASSWORD: 'YOUR_PASSWORD',
  REMOTE_PATH: '/your/remote/path'
};
```

- 优化入口文件

  ```js
  // 正确打印
  console.log('你好')
  
  // 无html，但也能让文字显示到网页方式一
  // 1. 选择器举例（改选 body / 容器 / 标签）
  const body = document.querySelector('body') 
  
  // 2. 正确修改元素内容
  body.innerHTML = '你好，mjlcode'
  
  // 方式二
  // 直接拿 body，最稳
  const body = document.body
  
  // 往页面写入文字
  body.innerHTML = '<h1>你好，mjlcode</h1>'
  ```

  - `html`、`head`、`body` 天生就存在无论有无html文件

  所以：

  - `document.body` ✅ 存在
  - `document.querySelector('body')` ✅ 能获取到
  - `document.querySelector('html')` ✅ 也能拿到



### 优化

#### 使传入的服务器相关参数由用户决定 

- 即用户使用插件时让用户传入（new AutoUploadWebpackPlugin（传参））

1. 修改webpack.config.js

   ```js
     plugins: [
       new HtmlWebpackPlugin({
         template: './public/index.html'
       }),
       new AutoUploadWebpackPlugin({
       	host: 'YOUR_HOST',
       	port: 22,
       	username: 'YOUR_USERNAME',
       	password: 'YOUR_PASSWORD',
       	remoteDir: '/your/remote/path'
       })
     ]
   ```

2. 修改插件

   ```js
   const fs = require('fs');
   const path = require('path');
   const { NodeSSH } = require('node-ssh');
   
   class AutoUploadWebpackPlugin {
     constructor(options = {}) {
       this.ssh = new NodeSSH();
       this.options = options;
     }
   
     apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('AutoUploadWebpackPlugin', (compilation, cb) => {// cb就是callback
	      // 1.获取打包后的文件夹 
	      const outputPath = compiler.options.output && compiler.options.output.path;
	      if (!outputPath) {
	        cb();
	        return;
	      }
	      const distPath = path.resolve(outputPath);// 把 webpack 打包输出目录变成绝对路径，方便后续上传文件
	
         const remotePath = this.options.remotePath;
   
         const run = async () => {
           try {
             // 2.链接远程服务器
             await this.connectServer();
             // 3. 删除远程服务器文件中内容
             await this.ssh.execCommand(`rm -rf ${remotePath}/*`);
             // 4. 上传文件夹的内容
             await this.uploadFiles(distPath, remotePath);
           } catch (err) {
             cb(err);
          return;
	        } finally {
             // 5. 断开ssh连接
             this.ssh.dispose();
           }
   
           // 调用callback
           cb();
         };
   
         run();
       });
	  }
   
     async connectServer() {
       const host = this.options.host 
       const port = this.options.port 
       const username = this.options.username 
       const password = this.options.password 
   
       await this.ssh.connect({
         ...(host ? { host } : {}),
         ...(port ? { port } : {}),
         ...(username ? { username } : {}),
         ...(password ? { password } : {})
       });
	  }
	
	  async uploadFiles(localPath, remotePath) {
	    if (!localPath || !remotePath) return;
       if (!fs.existsSync(localPath)) {
         throw new Error(`localPath not found: ${localPath}`);
       }
   
       const status = await this.ssh.putDirectory(localPath, remotePath, {
         recursive: true,
         concurrency: 10
       });
   
       if (!status) {
         throw new Error('uploadFiles failed');
       }
   
       return status;
     }
   
   }
   
   module.exports = AutoUploadWebpackPlugin;
   ```







## 2.4.配置对应服务器

### 先购买服务器和Nginx环境的搭建

**Nginx作用：高性能的 Web 服务器和反向代理服务器**

- **主要功能**

  1. **静态资源托管**：把前端 React/Vue 项目的 `build` 文件夹放进去，用户访问网站时，Nginx 就把 `index.html`、CSS、JS 静态文件返回给浏览器。
  2. **反向代理**：用户访问 `http://example.com/api`，Nginx 可以把请求转发到后端（比如 Node.js、Spring Boot、Go 服务）。
  3. **负载均衡**：如果有多个后端服务，Nginx 可以分发请求，提升并发性能。
  4. **HTTPS 配置**：通过 SSL 证书让网站支持 `https://`。

-  CentOS安装命令

  ```bash
  # 安装 Nginx
  sudo yum install -y nginx
  
  # 启动 Nginx
  sudo systemctl start nginx
  
  # 设置开机自启
  sudo systemctl enable nginx
  
  # 查看运行状态
  sudo systemctl status nginx
  ```

  Ubuntu安装命令

  ```bash
  # 更新软件源
  sudo apt update
  
  # 安装 Nginx
  sudo apt install -y nginx
  
  # 启动 Nginx
  sudo systemctl start nginx
  
  # 设置开机自启
  sudo systemctl enable nginx
  ```

你要“和老师一样（最小化）”，目标就是两件事：

- **插件把 `dist` 上传到服务器某个目录**（这就是 `remoteDir`）
- **Nginx `root` 指向同一个目录**，然后监听一个端口（比如 `3333`）

#### 配置nginx以及其他操作

##### 1) 先确定一个目录（remoteDir）
先决定你要把静态资源放到哪。建议不要用 `/root/...`（容易权限问题），用：

- `/usr/share/nginx/html/webpack`（推荐）

之后你的插件里 `remoteDir` 就写这个。

##### 2) 服务器上创建目录（一次就行）
在服务器执行：

```bash
sudo mkdir -p /usr/share/nginx/html/webpack
sudo chmod -R 755 /usr/share/nginx/html/webpack
```

- **`-p` 的作用**：

  - 上层目录不存在就一并创建
  - 目录已存在也不会报错（更适合写成“可重复执行”的命令）

- -R

  - 赋权限

- 查看是否配置成功命令

  - ls -ld /usr/share/nginx/html/webpack

    - 你应该看到类似（示例）：

      - 开头是 `drwxr-xr-x`（这就是 755）
      - 末尾路径是 `/usr/share/nginx/html/webpack`

      如果提示 `No such file or directory` 就是没创建成功。

新建配置文件：

```bash
sudo vim /etc/nginx/conf.d/webpack.conf
```

写入（把端口按你想要的来，比如 3333）：

```nginx
server {
    listen 3333;
    server_name _;

    location / {
        root /usr/share/nginx/html/webpack;
        index index.html;
    }
}
```

- 注意这里的 `root` 必须和你插件上传的 `remoteDir` **一致**。



- 解释

  ```js
  listen 3333;
  - → **端口号是 3333**
  server_name _;
  - → **不限制域名，任何域名 / IP 都能访问**
  ```

- :wq 报错并退出

  - w保存
  - q退出

##### 4）查看是否配置成功：cat /etc/nginx/conf.d/webpack.conf

##### 5) 检查 + 重载 Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

##### 常见踩坑（对照排查）
- **[上传成功但访问 403]** `root` 目录权限不够（优先别用 `/root/...`）
- **[访问 404]** `root` 指错了目录，或者目录里没有 `index.html`
- **[端口访问不了]** 服务器安全组/防火墙没放行 `3333`





### 为什么有些nginx配置那么复杂

因为你之前份配置是在解决“更完整的线上需求”，比如：

- **Vue Router history 模式**：需要 `try_files ... /index.html;`
- **反向代理后端 API**：`location /api/ { proxy_pass ... }`
- **静态资源强缓存**：`expires 1y`（但会引入更新不生效的问题，需要文件名 hash）
- **gzip 压缩**：提升性能
- **server_name / HTTPS / 安全头**：更正式的部署

你这里的配置演示如果只是“先跑起来”，这些都可以先不写。

##### 什么时候你必须写得更“长”？
满足下面任意一条，你就得加配置：

- **用 Vue/React 的 history 路由**（刷新页面 404）  
需要 `try_files $uri $uri/ /index.html;`
- **前端请求要转发到后端**（跨域 / 接口代理）  
需要 `location /api/ { proxy_pass ... }`
- **你想上线性能更好**（gzip、缓存、HTTPS）

##### 总结
- **原因**：你老师用的是“静态站点最小可用配置”，只要 `listen + root + index` 就能跑起来。  
- **关键对齐点**：Nginx 的 `root` 必须和你插件上传的 `remoteDir` 一致。  
- **需要扩展时机**：history 路由、反向代理 API、缓存/gzip/HTTPS 等才需要写更多。





### 网络问题

#### ssh连接不到服务器

- 原因是因为你配置config错误

  - 你之前sshroot@url

  ```js
  Host 101.33.196.88
    HostName 101.33.196.88
    User sshroot// 错误
  ```

  - 改回

    ```
    Host 101.33.196.88
      HostName 101.33.196.88
      User root
    ```

#### webpack的port和nginx的port区别

- 前者是服务器的地址，以及你访问访问器的地址
  - 因为这里要账号和密码

- 后者则是访问浏览器浏览器你放到网站的端口

##### 要是还不行，那就是你服务器安全组没设置对应端口比如nginx配置的端口





# 二。自动化工具 - gulp

## 2.1.gulp的核心理念


### 和webpack对比

#### 定位差异

- gulp：更偏 **task runner（任务编排器）**
  - 你声明一系列任务（清理、拷贝、编译、压缩、启动服务、监听等）
  - gulp 负责按你定义的顺序/并发去执行这些任务
- webpack：更偏 **module bundler（模块打包器）**
  - 以 JS 模块为入口构建依赖图
  - 输出 bundle/chunk/asset，并在“模块系统 + 依赖图”模型下做优化（tree-shaking、code splitting、runtime 等）

#### 核心模型差异（怎么组织工作）

- gulp：**以文件流为中心**
  - `src(glob)` 读文件 -> `pipe(plugin...)` 转换 -> `dest()` 写出
  - 更像“对一堆文件做流水线加工”
- webpack：**以模块依赖图为中心**
  - 从入口解析 `import/require`，把模块、chunk、asset 组织成图
  - loader/plugin 在“构建生命周期”中处理各种资源

#### 优缺点

##### gulp 优点

- 灵活：对“非模块化的文件处理”很顺手（比如纯 HTML/CSS/图片/字体的批处理、拷贝、压缩、加 hash）
- 任务编排清晰：`series/parallel` 明确表达先后关系/并发关系
- 对“项目外流程”友好：比如生成代码、同步文件、部署、清理等

##### gulp 缺点

- 不天然理解模块依赖：要自己处理“依赖图 / 按需加载 / 分包”等能力（或者借助其它工具）
- 生态在“应用打包”方向不如 webpack 统一：很多能力需要自己挑选插件并组合

##### webpack 优点

- 应用构建能力强：天然围绕“模块化前端应用”提供分包、缓存、tree-shaking、HMR、生产优化等
- 统一的构建模型：JS/CSS/图片等资源都能进入同一个依赖图和生命周期

##### webpack 缺点

- 对“与模块依赖无关的任务”不够直接：清理/拷贝/批处理虽然能做，但表达和实现成本更高
- 配置复杂度更高：为了通用性引入了更多概念与细节


### gulp 作为 task runner 的理解

- gulp 的核心不是“打包”，而是“把一堆任务组织起来自动执行”
- 任务本质：一个函数
  - 要么接收 `cb` 并在结束时调用
  - 要么返回 `stream / promise / child_process / observable`
- 组合任务：
  - `series(a, b, c)` 串行（有先后依赖）
  - `parallel(a, b, c)` 并行（互不依赖）


### 使用场景

- 你更适合用 gulp 的情况：
  - 静态资源流水线：`html/less/sass` 编译、压缩、加前缀、拷贝、生成 sourcemap
  - 多页面/传统项目：不以“模块依赖图”作为核心的工程
  - 简单的小项目
  
- 你更适合用 webpack 的情况：
  - SPA/React/Vue 等模块化应用的开发与生产构建
  - 需要成熟的分包策略、运行时代码、模块级优化和生态工具链





## 2.2.编写的gulp任务

### 安装

- 项目内安装（推荐）：

```bash
npm i -D gulp
```


### 简单使用

在项目根目录创建 `gulpfile.js`：

```js
const gulp = require('gulp');

function hello(cb) {
  console.log('hello');
  cb();
}

exports.hello = hello;// 或module.exports = { hello }
exports.default = hello;// 默认任务
```

exports和module.exports区别

- 本质：`module.exports` 才是 CommonJS 最终导出的对象；`exports` 只是它的一个“引用/别名”（初始化时近似：`exports = module.exports`）
- 你可以用 `exports.xxx = ...` 往导出对象上挂属性：

  ```js
  exports.a = 1;
  // 等价
  module.exports.a = 1;
  ```

- 但不要写 `exports = {...}` 来“整体替换导出”，因为这只会改变局部变量 `exports` 的指向，`module.exports` 没变：

  ```js
  exports = { a: 1 }; // 错误：require 拿不到这个对象
  module.exports = { a: 1 }; // 正确：整体替换导出
  ```

执行任务：

注意：记得文件名必须改为**gulpfile.js** 才有作用

```bash
npx gulp hello
```

执行默认任务：

```bash
npx gulp
```

#### cb 的作用

- 用来告诉 gulp：这个任务什么时候完成
- 同步任务：执行完后调用一次 `cb()` 即可
- 异步任务：异步结束时调用 `cb()`，出错时 `cb(err)`


### 返回值类型（来终止命令，否则一直执行）

gulp4 中，一个任务函数需要通过以下方式之一表达“结束”：

- 使用 `cb` 回调
- 返回 `Stream`
  - 比如
    -   return src('src/js/**/*.js', { allowEmpty: true }).pipe(dest('dist/js'));这里返回的就是流

- 返回 `Promise`
- 返回 `ChildProcess`
- 返回 `Observable`


### default（默认任务）

- `exports.default = task` 用来指定 `gulp` 不带任务名时执行哪个任务
- npx gulp


### gulp4.x 之前任务编写（gulp3）

gulp3 常见写法（了解即可，工作中基本都是 gulp4）：

```js
const gulp = require('gulp');

gulp.task('hello', function () {
  console.log('hello');
});

gulp.task('default', ['hello']);
```



# esmodule 和 commonjs 区别

```js
// ESModule（ESM）
import xxx from 'xxx'
import { a, b as bb } from 'xxx'
export const a = 1
export function foo() {}
export default function bar() {}

// CommonJS（CJS）
const x = require('xx')
exports.a = 1
module.exports = { a: 1 }
module.exports = function () {}
```







## 2.3.gulp的任务组合


### 问题背景（出现是为了解决什么问题）

当你的构建流程不止一个任务时，通常会遇到：

- 有些任务必须先后执行（例如先 `clean` 再 `build`）
- 有些任务可以并发执行以节省时间（例如同时构建 `js/css/html`）
- 任务会越来越多，如果没有“组合能力”，就会变成手动一个个执行、难维护

gulp4 提供 `series/parallel` 来表达任务之间的“先后依赖”和“并发关系”（也替代了 gulp3 时代的依赖数组写法）。


### parallel

#### 作用

- 并行执行多个任务
- 适合彼此之间**没有依赖关系**的任务（互不影响）

#### 使用

```js
const { parallel } = require('gulp');

function js(cb) {
  setTimeout(() => {
    console.log(`[${Date.now()}] build js`);
    cb();
  }, 1000);
}

function css(cb) {
  setTimeout(() => {
    console.log(`[${Date.now()}] build css`);
    cb();
  }, 300);
}

exports.build = parallel(js, css);
```

- 执行命令：

```bash
gulp build
```

- 输出（顺序不固定，取决于并发调度）：

```bash
[09:42:56] Starting 'js'...
[09:42:56] Starting 'css'...
[1777513376489] build css
[09:42:56] Finished 'css' after 305 ms
[1777513377190] build js
[09:42:57] Finished 'js' after 1.01 s
[09:42:57] Finished 'build' after 1.01 s
```





### series

#### 作用

- 串行执行多个任务（前一个完成后才会开始下一个）
- 适合有明确依赖顺序的任务

#### 使用

```js
const { parallel, series } = require('gulp');

function js(cb) {
  setTimeout(() => {
    console.log(`[${Date.now()}] build js`);
    cb();
  }, 1000);
}

function css(cb) {
  setTimeout(() => {
    console.log(`[${Date.now()}] build css`);
    cb();
  }, 300);
}

// exports.build = parallel(js, css);
exports.build = series(js, css);
```

- 执行命令：

```bash
gulp
```

- 输出（顺序固定）：

```bash
[1777513491338] build js
[09:44:51] Finished 'js' after 1.01 s
[09:44:51] Starting 'css'...
[1777513491648] build css
[09:44:51] Finished 'css' after 309 ms
[09:44:51] Finished 'build' after 1.32 s
```



## 2.4.读取和写入文件 src/dest


### 概念

- `src(glob)`：从磁盘读取一批文件，返回一个可 `pipe` 的文件流（Vinyl 文件对象流）
- `dest(path)`：把流里的文件写回磁盘（输出到目标目录）
- `pipe(plugin)`：把文件流交给插件做转换（例如：重命名、压缩、编译）
  - pipe是node内置的方法，src和dest则是gulp内置的



### 作用

- 把“处理文件”的流程串起来：读 -> 转换 -> 写
- 常见用途：
  - 拷贝静态资源（图片/字体/html）到 `dist`
  - 对文件做批处理（压缩、加前缀、编译 less/sass、生成 sourcemap）
  - 按 glob 选择要处理/排除的文件


### 使用

最常见的“拷贝”例子：

```js
const { src, dest } = require('gulp');

function copyAssets() {
  return src('src/**/*', { allowEmpty: true })
    .pipe(dest('dist'));
}

exports.copy = copyAssets;
```

- 执行命令：

```bash
gulp copy
```

- 结果：
  - 会把 `src/assets/` 下的所有文件（含子目录）复制到 `dist/assets/`


### glob 文件匹配三种方式

#### 方式1：精确匹配（指定文件）

```js
src('src/index.html')
```

#### 方式2：通配匹配（批量匹配）

- `*`：匹配一层文件名
- `**`：匹配任意层级目录

```js
src('src/*.html')
src('src/**/*.js')
```

#### 方式3：排除匹配（否定模式）

用数组传多个 glob，`!` 表示排除：

```js
src([
  'src/**/*.js',
  '!src/**/__tests__/**',
  '!src/**/*.spec.js'
])
```







## 2.5.js文件的处理 babel/terser

- 安装

  - 命令
  - 要是自己想看还有什么，去gulp官网

  ```bash
  npm i -D gulp-babel @babel/core @babel/preset-env
  npm i -D gulp-terser
  ```

- 使用

  `babel`：把 ES6+ 转成 ES5（可配置目标浏览器/运行环境）

  `terser`：压缩 JS（生产环境常用）

  在 `gulpfile.js` 写一个简单任务（假设源码在 `src/js/**/*.js`）：

  ```js
  const { src, dest, series } = require('gulp');
  const babel = require('gulp-babel');
  const terser = require('gulp-terser');
  
  function buildJs() {
    return src('src/js/**/*.js', { allowEmpty: true })
      .pipe(babel({presets:["@babel/preset-env"]}))
      .pipe(terser({
        mangle: {
          toplevel: true
        }
      }))
      .pipe(dest('dist/js'));
  }
  
  exports.build = buildJs;
  ```
  
  - terser 参数补充（常见容易混）
  
    - `terser({ mangle: { toplevel: true } })`
      - 只影响 **mangle（变量/函数名改名）**
      - 允许对顶层作用域的标识符也改名（更小体积）
    - `terser({ toplevel: true })`
      - 删除得更多
      - 做库（library）时更要谨慎：如果你依赖某些顶层名字作为对外 API，可能会被改名/删除
  
  - 执行命令
  
    ```bash
    npx gulp build
    ```

  - 对babel的preset提取babel.config.js
  
    在项目根目录新建 `babel.config.js`：

    ```js
    module.exports = {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['> 1%', 'last 2 versions', 'not dead']
            }
          }
        ]
      ]
    };
    ```
  
    



## 2.6.开发和生产环境的搭建

### 打包js文件（2.5就是）





### 打包html文件

- 安装

  - 命令

  ```bash
  npm i -D gulp-htmlmin
  ```

- 作用

  - 压缩 HTML（去空格、去注释等），减少体积
  - 通常用于生产构建阶段，把 `src` 的 html 输出到 `dist`

- 使用

  ```js
  const { src, dest } = require('gulp');
  const htmlmin = require('gulp-htmlmin');
  
  function buildHtml() {
    return src('src/**/*.html', { allowEmpty: true })
      .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
      .pipe(dest('dist'));
  }
  
  exports.html = buildHtml;
  ```

  - 执行命令

    ```bash
    npx gulp html
    ```

  - 效果

    - 会把 `src/**/*.html` 输出到 `dist/`（目录结构保持一致）
    - HTML 会被压缩（空白减少、注释移除）




### 打包less文件

- 安装

  - 命令

  ```bash
  npm i -D gulp-less less
  npm i -D gulp-clean-css
  ```

  - 作用
    - 把 `.less` 编译成 `.css`
    - 生产环境常配合压缩 CSS，减少体积

- 使用

  ```js
  const { src, dest } = require('gulp');
  const less = require('gulp-less');
  const cleanCSS = require('gulp-clean-css');
  
  function buildLess() {
    return src('src/less/**/*.less', { allowEmpty: true })
      .pipe(less())
      .pipe(cleanCSS())
      .pipe(dest('dist/css'));
  }
  
  exports.less = buildLess;
  ```

  - cleanCSS()

    - 作用：CSS 做 **压缩 + 优化**

  - 执行命令

    ```bash
    npx gulp less
    ```

  - 效果

    - `src/less/**/*.less` 会被编译并输出到 `dist/css/`（扩展名变成 `.css`）
    - 生成的 css 会被压缩



### 注入功能

- 安装

  - 命令

  ```bash
  npm i -D gulp-inject
  ```

  - 作用
    - 把构建后的 `css/js` 自动注入到 `html` 中（生成 `<link>`/`<script>` 标签）
    - 适合多页面或非打包器场景，避免手动维护资源引用

- 使用

  `inject` 只做“往 html 里插入资源引用”这一步，所以前提是你已经把 html/css/js 构建到 `dist` 里了。

  - `inject(sources, options)` 常用 options 说明：

    - `ignorePath: 'dist'`
      - 生成注入路径时，把匹配到的文件路径里的 `dist` 前缀去掉
      - 例如真实文件是 `dist/js/app.js`，注入时希望得到 `js/app.js`

    - `addRootSlash: false`
      - 控制注入路径前面要不要加 `/`
      - `false`：注入 `js/app.js`
      - `true`：注入 `/js/app.js`

    - `relative: true`
      - 让注入路径相对“当前 html 文件所在目录”来生成
      - 例如 html 在 `dist/pages/a.html`，资源在 `dist/js/app.js`，可能会注入成 `../js/app.js`
      - 为什么这里没用：这个示例希望注入的引用统一从 `dist` 根目录出发（`js/...`、`css/...`），所以用 `ignorePath + addRootSlash` 来控制更直观

  - 注入位置（重点）

    `gulp-inject` 需要你在 html 里提前写好“占位符”，它不要求必须叫 `index.html`，只要是你要处理的 html 都要放：

    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>gulp project</title>
        <!-- inject:css -->
        <!-- endinject -->
    </head>
    <body>
        <!-- inject:js -->
        <!-- endinject -->
    </body>
    </html>
    ```

  ```js
  function buildHtml() {
    return src('src/**/*.html', { allowEmpty: true })
      .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
      .pipe(dest('dist'));
  }
  
  function buildLess() {
    return src('src/less/**/*.less', { allowEmpty: true })
      .pipe(less())
      .pipe(cleanCSS())
      .pipe(dest('dist/css'));
  }
  
  function buildJs() {
    return src('src/js/**/*.js', { allowEmpty: true })
      .pipe(babel({ presets: ['@babel/preset-env'] }))
      .pipe(terser())
      .pipe(dest('dist/js'));
  }
  
  function injectAssets() {
    const sources = src(['dist/css/**/*.css', 'dist/js/**/*.js'], { read: false, allowEmpty: true });// read: false,只把文件路径（Vinyl 对象的元信息）放进流里，不读取文件内容到内存（file.contents 会是 null）
    return src('dist/**/*.html', { allowEmpty: true })
      .pipe(inject(sources, { ignorePath: 'dist', addRootSlash: false }))
      .pipe(dest('dist'));
  }
  
  
  exports.build = series(buildHtml, buildLess, buildJs, injectAssets);
  或者
  exports.build = series(parallel(buildHtml, buildLess, buildJs),injectAssets)
  ```

  - 执行命令（（注意先后顺序））

    ```bash
    npx gulp build
    npx gulp inject
    ```

    - 注意：这里把 `html` 也写入 `dist` 的原因：注入发生在 `dist/**/*.html` 上，如果 `dist` 里还没有 html，就无法注入，所以需要先把 `src` 的 html 拷贝/压缩到 `dist`。





### gulp 中 watch 使用

#### 作用

- 监听文件变化（保存后自动触发任务），用于开发阶段提高效率
- 常见配合：
  - 监听 `js/css/html` 文件变更 -> 自动重新构建对应产物


#### 使用

```js
const { src, dest, watch, series } = require('gulp');
const terser = require('gulp-terser');

function buildJs() {
  return src('src/js/**/*.js', { allowEmpty: true })
    .pipe(terser())
    .pipe(dest('dist/js'));
}

function buildHtml() {
  return src('src/**/*.html', { allowEmpty: true })
    .pipe(dest('dist'));
}

function devWatch() {
  watch('src/js/**/*.js', series(buildJs));
  watch('src/**/*.html', series(buildHtml));
}

exports.dev = series(buildJs, buildHtml, devWatch);
```

- 执行命令：

```bash
npx gulp dev
```

- 效果
  - 命令行会常驻（不退出）
  - 当你修改并保存 `src/js/**/*.js`：会自动重新执行 `buildJs`，更新 `dist/js`
  - 当你修改并保存 `src/**/*.html`：会自动重新执行 `buildHtml`，更新 `dist`



### server 和 watch 的使用

- 安装

  ```bash
  npm i -D browser-sync
  ```

- 作用
  - 启动一个本地静态服务器，托管 `dist` 目录
  - 配合 `watch` 做到“保存 -> 重新构建 -> 自动刷新浏览器”

- 类比 webpack
  - webpack：`webpack-dev-server` / `devServer` 提供开发服务器 + 自动刷新/HMR（基于模块打包的开发流）
  - gulp：通常是 `watch` 负责监听与触发任务，`browser-sync` 负责起服务和刷新（基于文件流/产物目录的开发流）

- 使用

  ```js
  const browserSync = require('browser-sync').create();
  // 构建HTML
  function buildHtml() {
    return src('./index.html', { allowEmpty: true })
      .pipe(htmlmin({ collapseWhitespace: true }))
      .pipe(dest('dist'));
  }
  // 构建LESS
  function buildLess() {
    return src('src/less/**/*.less', { allowEmpty: true })
      .pipe(less())
      .pipe(cleanCSS())
      .pipe(dest('dist/css'));
  }
  // 构建JS
  function buildJs() {
    return src('src/**/*.js', { allowEmpty: true })
      .pipe(babel({presets:["@babel/preset-env"]}))
      .pipe(terser({
        mangle: {
          toplevel: true
        }
      }))
      .pipe(dest('dist'));
  }
  // 注入资源
  function injectAssets() {
    const sources = src(['dist/css/**/*.css', 'dist/**/*.js'], { read: false, allowEmpty: true });
    return src('dist/**/*.html', { allowEmpty: true })
      .pipe(inject(sources, { ignorePath: 'dist', addRootSlash: false }))
      .pipe(dest('dist'));
  }
  function serve(cb) {
    browserSync.init({
      port: 8080,
      open: true,
      files: './dist/**',
      server: {
        baseDir: './dist'
      }
    });
    cb();
  }
  // watch和server一起使用，作用和webpack开启本地服务器一样
  function devWatch() {
    watch('./index.html', series(buildHtml, injectAssets));
    watch('src/less/**/*.less', series(buildLess, injectAssets));
    watch('src/**/*.js', series(buildJs, injectAssets));
  }
  exports.dev = series(exports.build, serve, devWatch);
  ```
  
  
  
  - 代码解释
  
    - `baseDir: './dist'` 是 `browser-sync` 在 **静态服务器模式** 下的配置，意思是：
  
      ###### 作用
  
      - 指定 **静态资源的根目录（网站根目录）** 是 `./dist`
      - 访问浏览器 `http://localhost:8080/` 时，BrowserSync 会去 `./dist` 里找文件返回
  
    - files: './dist/**'**
  
      - **作用：**dist 目录下任何文件有变化（html/css/js/图片等），浏览器都会自动更新**
  
  - 执行命令
  
    ```bash
    npx gulp dev
    ```
  
  - 效果
    - 终端常驻
    - 浏览器会自动打开 `http://localhost:3000`
    - 修改并保存 `src/**/*.html` 后，会重新输出到 `dist`，然后浏览器自动刷新



# 三。库打包工具 - rollup

## rollup体积小是因为他没想webpack一样安装很多功能的插件

### 这些插件等你需要再去一样安装

- 插件位置-rollup官网有

## rollup帮你打包成库，说明别人使用你的库，也是要安装，然后安装依赖

	#### 所以依赖node_modules那些你不用导入你的包中（即和webpack一样）



## vite底层就是基于rollup





## 3.1.rollup核心思想和场景

### rollup 核心思想

- **定位**：Rollup 更偏向 **JavaScript 库（library）打包器**，核心目标是把源码模块（尤其是 ESM）打成更“干净”的产物，便于别人 `import`/`require`。
- **tree-shaking**：基于 ESM 的静态结构分析，把没有被使用的导出在构建阶段裁剪掉，产物通常更小、更利于二次 tree-shaking。（之前webpack没有tree-shaking）
- **产物形态多样**：一个库往往需要同时产出多种格式：
  - `esm`：给现代 bundler（Vite/webpack/rollup）用
  - `cjs`：给 Node / 老生态用
  - `umd`/`iife`：给 `<script>` 直接引入用（浏览器全局变量）

### rollup 打包库文件

#### 库的入口与导出设计

- **尽量用 ESM 导出**：让 tree-shaking 更稳定
  - 可以使用commonjs，但还要安装其他依赖
- **对外 API 要稳定**：不要依赖内部文件路径（用户只从入口导入）





### 和 webpack 对比

#### 定位差异

- Rollup：更偏 **库打包**
  - 强调 ESM、tree-shaking、产物干净
  - 常见输出多格式（`esm/cjs/umd`），适配不同使用场景
- Webpack：更偏 **应用打包**
  - 更擅长处理“应用工程”的复杂需求（多入口、动态 import 分包、运行时代码、各种资源整合、HMR 等）
    - 所以webpack比rollup的node_modules要繁重很多

#### 产物与优化差异（常见体感）

- Rollup 产物通常更接近“源码结构”，包装层更少，适合做库
- Webpack 产物通常包含更多 runtime/引导代码，适合做应用（尤其是复杂应用的分包与缓存策略）

### 应用场景（什么时候选 rollup）

- **组件库 / 工具库 / SDK**
  - 例如：UI 组件库、hooks 库、utils 库、业务 SDK
- **需要产出多种模块格式**
  - 同时给 Node（cjs）和现代 bundler（esm）使用
- **强调 tree-shaking 体验**
  - 希望使用者只打进用到的那部分代码
- **你希望库产物更可控**
  - 输出结构、导出形式、banner、sourcemap 更确定

- **什么时候更适合用 webpack（或 Vite）**
  - 做应用（SPA/多页应用），需要 dev-server、HMR、复杂资源处理、分包与缓存策略





## 3.2.命令行打包 npx rollup

### browser / amd / node / umd 是什么

这这些词本质是在描述：**代码要跑在哪 / 用哪种模块规范加载**。

- **browser**
  - 场景：浏览器里用 `<script>` 直接引入
  - 在 rollup 中通常对应：
    - `format: 'iife'`（更纯粹的“浏览器脚本”产物）
      - 全称Immediately Invoked Function Expression
- **amd**
  - 场景：RequireJS 那一套 `define([...], factory)`
    - 标识符define就是amd环境（很少用，了解即可）
  - rollup：`format: 'amd'`
- **node**
  - 场景：Node.js 的 CommonJS：`require/module.exports`
  - rollup：`format: 'cjs'`
- **umd**
  - 场景：同一份产物既能在浏览器 `<script>` 用，又能在 AMD / CommonJS 环境用
  - rollup：`format: 'umd'`

补充：现代前端更推荐的格式

- **esm**：rollup 里对应 `format: 'es'`（给 Vite/webpack 等 bundler 用，tree-shaking 体验最好）

### index.js（入口文件）

- `index.js`

  ```js
  function Alog(msg) {
    console.log(msg)
  }
   
  Alog('hellow rollup')
  ```

### 执行 umd 命令（命令行直接打包）

1）先安装 rollup

```bash
npm i -D rollup
```

2）打包成 UMD（最常用示例）

```bash
npx rollup ./index.js --file dist/bundle.umd.js --format umd --name MyLib
```

- `--format umd`
  
  - 指定输出的模块格式
- `--name MyLib`
  
  - 只有 `umd/iife` 这种“需要挂全局变量”的格式需要
  - 浏览器里 `<script src="dist/bundle.umd.js"></script>` 后，一般能通过 `window.MyLib`（或 `globalThis.MyLib`）访问导出
  
    - rollup 需要你提供一个名字（`MyLib`），把“库的导出”挂到全局对象上：
      - 浏览器环境的全局对象通常是 `window`
      - 更通用写法是 `globalThis`（在浏览器里也能用）
    - 产物内部一般会做类似的事情（伪代码理解即可）：
    
      ```js
      // bundle 执行时：把库挂到全局
      globalThis.MyLib = factory()
      ```
    
    - 注意：你的入口文件如果没有 `export` 任何东西，那 `window.MyLib` 就可能是 `{}` 或 `undefined`
      - 因为脚本只有“副作用”（比如 `console.log`），并没有“对外 API”
  
    一个能看懂 `window.MyLib` 的例子（建议库写法）
    
    - `index.js`
    
      ```js
      export function AAAlog(msg) {
        console.log(msg)
      }
      ```
    
    - 重新打 UMD
    
      ```bash
      npx rollup ./index.js --file dist/bundle.umd.js --format umd --name MyLib
      ```
    
    - 浏览器里使用（脚本直引）
    
      ```html
      <script src="./dist/bundle.umd.js"></script>
      <script>
        MyLib.AAAlog('hello from browser')
      </script>
      ```

 3）同一个入口输出不同格式（对比理解）

 ```bash
# browser（更纯粹的脚本直引）
npx rollup ./index.js --file dist/bundle.iife.js --format iife --name MyLib
 
# node（CommonJS）
npx rollup ./index.js --file dist/bundle.cjs.js --format cjs
 
# esm（给 bundler 用，给现代 bundler（Vite/webpack/rollup）使用）
npx rollup ./index.js --file dist/bundle.esm.js --format es
 ```

### 对打包后文件解释（UMD 产物结构）

```js
(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  function Alog(msg) {
    console.log(msg);
  }
   
  Alog('hellow rollup');

}));
```

- 优化（翻译）

  ```js
  const foo = (function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory(); // define包裹函数就是amd
  })
  
  foo((function () { 'use strict';
  
    function Alog(msg) {
      console.log(msg);
    }
     
    Alog('hellow rollup');
  
  }));
  
  ```



### 有外部依赖时（例如 lodash/react）

命令行方式也能外部化依赖（不打进 bundle）：

```bash
npx rollup ./index.js \
  --file dist/bundle.umd.js \
  --format umd \
  --name MyLib \
  --external lodash \
  --globals lodash:_
```

- `--external lodash`
  - 告诉 rollup：不要把 lodash 打进去（让使用者自己提供）
- `--globals lodash:_`
  - 只在 UMD/IIFE 这类浏览器全局格式下需要
  - 表示：外部依赖 `lodash` 在浏览器中由全局变量 `_` 提供（CDN 引入 lodash 常见就是 `_`）





## 3.3.rollup配置文件编写

### 常见配置

- rollup.config.js

  - 依旧使用commjs，因为运行rollup.config.js是在node环境
    - 而打包采用rollup，使用的ES
  
  ```js
  // rollup.config.js
  module.exports =  {
    // 从哪个入口开始打包
    input: './src/index.js',
  
    // 哪些依赖不打进产物（做库通常 external）
    // 常见：react/vue/lodash 等
    external: ['lodash'],
  
    // 一个库经常要输出多种格式（给不同环境用）
    output: [
      // esm：给现代 bundler（Vite/webpack/rollup）使用
      {
        file: 'dist/index.esm.js',
        format: 'es',
        sourcemap: true
      },
  
      // node：CommonJS
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true
      },
  
      // browser：脚本直引（更纯粹的浏览器场景）
      {
        file: 'dist/index.iife.js',
        format: 'iife',
        name: 'MyLib',
        globals: {
          lodash: '_'
        },
        sourcemap: true
      },
  
      // umd：同时兼容 browser/amd/cjs
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'MyLib',
        globals: {
          lodash: '_'
        },
        sourcemap: true
      },
  
      // amd：RequireJS 环境（了解即可）
      {
        file: 'dist/index.amd.js',
        format: 'amd',
        sourcemap: true
      }
    ]
  }
  ```
  
  - `input`
    - 入口文件（从这里开始构建依赖图）
  - `output.format`
    - `es`：esm
    - `cjs`：node/commonjs
    - `iife`：browser 脚本直引
    - `umd`：通用（browser + amd + cjs）
    - `amd`：requirejs
  - `output.name`
    - 只有 `umd/iife` 需要
    - 用来把库挂到全局：`window.MyLib` / `globalThis.MyLib`
  - `external`
    - 告诉 rollup：这些依赖不要打进 bundle（库打包常用）
  - `output.globals`
    - 只在 `umd/iife` 且存在 `external` 时需要
    - 表示：外部依赖在浏览器里对应哪个全局变量名（例如 lodash 对应 `_`）
  - `sourcemap`
    - 建议库也输出 sourcemap，方便使用者调试



### 执行的命令

- npx rollup -c



## 3.4.commonjs/node_modules

### 安装解决 commonjs 的库

- 插件：`@rollup/plugin-commonjs`
- 作用：把第三方包里常见的 **CommonJS 写法**（`require/module.exports`）转换成 Rollup 能理解的形式
- 命令：

```bash
npm i -D @rollup/plugin-commonjs
```

### 安装解决 node_modules 的库

- 插件：`@rollup/plugin-node-resolve`
- 作用：解决“`import 'lodash'` 这种**包名导入**怎么定位到具体文件”的问题
  - Rollup 默认不会完整实现 Node 那套“从 `node_modules` + `package.json`（main/module/exports）里解析入口文件”的逻辑
  - `node-resolve` 会把包名解析成具体入口文件路径（例如解析到 `lodash` 的入口文件）
- 命令：

```bash
npm i -D @rollup/plugin-node-resolve
```

### 为什么需要装这两个

- Rollup 天然更“偏 ESM”，它最擅长处理你源码里的 `import/export`
- 但真实项目里经常会遇到两类问题：
  - **依赖包在 node_modules 里（找不到入口文件）**：用 `node-resolve` 负责“解析包名 -> 找到入口文件”
  - **依赖包入口文件是 CommonJS（看不懂 require/module.exports）**：用 `commonjs` 负责“把 CJS 转成 rollup 更好分析的模块”



### `external: ['lodash']` 这行的目的

- 目的：告诉 Rollup **lodash 不要打进 bundle**

  - 因为使用者会直接**npm i 你的库名**导入你写好的库，然后他自己会安装依赖

- 原因（库打包常见做法）：
  - 避免重复打包（应用里往往已经有 lodash）
  - 避免版本冲突（由使用者决定 lodash 版本）
  - 产物更小

- 为了处理什么：
  - 为了处理“第三方依赖由外部提供”的场景
  - 对 `umd/iife` 这种浏览器全局格式，还需要配合 `output.globals` 告诉 Rollup：
    - 包名 `lodash` 在浏览器里对应的全局变量名是 `_`
    - 所以常见写法是：
      - `external: ['lodash']`
      - `output.globals: { lodash: '_' }`
    



### 使用

```javascript
// rollup.config.js
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  input: './src/index.js',
  external: ['lodash'],
  output: [
    // ...省略 output（你 3.3 已经写了）
  ],
  plugins: [
    nodeResolve(),
    commonjs()
  ]
};
```

- 这两个库是在 `rollup.config.js` 的 `plugins` 里使用（不是在业务代码里 import）



## 3.5.对js文件进行处理

- babel

  - 安装命令

    ```bash
    npm i -D @rollup/plugin-babel @babel/core @babel/preset-env
    ```

  - 作用
    - 把你的源码从 ES6+ 转成 ES5（或你指定的目标环境），提高兼容性

- terser

  - 安装命令

    ```bash
    npm i -D @rollup/plugin-terser
    ```

  - 作用
    - 压缩 JS（去空格、缩短变量名、删除不可达代码等）

  - 之前是使用 uglify 来压缩
    - 现在更常用 **terser**，因为它支持 ES2015+（uglify-js 对新语法支持差/需要额外降级）

- 使用

  ```js
  // rollup.config.js
  const { babel } = require('@rollup/plugin-babel');
  const terser = require('@rollup/plugin-terser');
   
  module.exports = {
    input: './src/index.js',
    output: [
      // ...你的 output
    ],
    plugins: [
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env'],
        exclude: 'node_modules/**'
      }),
      terser()
    ]
  };
  ```

  - `babelHelpers: 'bundled'` 作用
    - Babel 在把新语法降级时，会注入一些 **helper 函数**（比如处理类/继承/对象展开等）
    - `'bundled'` 表示：把这些 helpers **直接打进当前输出 bundle 里**
      - 优点：不用额外安装/引入其它运行时依赖（配置最省心）
      - 缺点：如果你输出多个产物（esm/cjs/umd/iife），每个产物可能都会带一份 helpers（体积会重复）
    - 其它常见选择：
      - `'runtime'`：把 helpers 抽到 `@babel/runtime`（通常需要安装 `@babel/runtime`，体积更可控）
      - `'external'`：让 helpers 作为外部依赖，不打进产物
