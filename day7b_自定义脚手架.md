# 三。whycli脚手架开发

## 3.1.脚手架实现的原理

- 具体对 `package.json` 的 `bin` 属性

  - `bin` 的作用是：**声明“安装这个包之后，对外暴露哪些命令”**。
  - 常见写法：
    - 单命令（字符串）：
      - `"bin": "./bin/index.js"`
    - 多命令（对象）：
      - `"bin": { "whycli": "./bin/whycli.js", "why": "./bin/whycli.js" }`
  - `bin` 里的 key 就是用户要敲的命令名（如 `whycli`），value 是对应要执行的脚本文件路径。

- 案例：平时安装的库中

  - **前提**：某个包在它自己的 `package.json` 里声明了 `bin`，并且这个包被安装到了当前项目（出现在 `node_modules`）
  - **安装时发生什么**：包管理器会在当前项目生成一个“命令入口/垫片（shim）”
    - 位置：`node_modules/.bin/<命令名>`
    - Windows 下通常还会额外生成：`<命令名>.cmd` / `<命令名>.ps1`
  - **shim 的本质**：它不是你的源码本体，而是一个很薄的启动器（由package.json的bin转换过来），最终会去执行 `bin` 字段里配置的那个 JS 入口文件
    - 为什么要转换，因为不同编译器直接去找package的bin会编译错误
  - **为什么 `pnpm exec` / `npx` / `npm run` 能直接敲命令**：它们会把当前项目的 `node_modules/.bin` 临时加入到 PATH，然后在 PATH 里找到对应的 shim 并执行（.bin意思是node_modules的bin目录）
    - `pnpm exec whycli ...`
    - `npx whycli ...`
    - `npm run xxx`（脚本里写 `whycli`）
  - **避免误解**：你在“当前项目”的 `package.json` 里写了 `bin`，并不会立刻让系统出现一个全局命令；只有当这个项目作为“一个包”被安装/被 link 到其它地方时，包管理器才会为它生成对应的入口

- “要执行文件上面有个**注释**”的作用

  - 在可执行 JS 文件第一行写：
    - `#!/usr/bin/env node`
  - 这行叫 **shebang**，作用是告诉系统：**用 `node` 来解释执行这个文件**。
  - 注意点：
    - 这行必须写在文件第一行
    - 文件需要有可执行权限（在类 Unix 系统中通常还要 `chmod +x`；Windows 主要依赖 `.cmd` 垫片）

- 最小示例（一个能工作的 CLI 包）

  - 目录结构

    - `my-cli/`
      - `lib/index.js`
      - `package.json`

  - `package.json`

    ```json
    {
      "name": "my-cli",
      "version": "1.0.0",
      "bin": {
        "whycli": "./lib/index.js"
      }
    }
    ```

  - `lib/whycli.js`

    ```js
    #!/usr/bin/env node
    console.log('hello whycli');
    console.log('argv:', process.argv.slice(2));
    ```

  - 使用方式（本地调试的两种常见方式）

    - 在该包目录（即my-cli）执行 `npm link` / `pnpm link --global` 后，终端可直接敲 `whycli`
    - 或者在其它项目里安装它后，用 `pnpm exec whycli` 来运行
      - 即安装my-cli这个脚手架后

  - 报错，因为你package.json里面name的值格式不对，导致npm link不行





## 3.2.version/options

### 实现my-cli -v

- 安装commander

  - 命令

   ```bash
  pnpm add commander
   ```

- my-cli/package.json 要点

  - `version` 字段会被 `-v/--version` 输出用到（你也可以从代码里读取这个版本号）

  - `bin` 映射的入口文件就是 commander 的启动文件

  - 示例

    ```json
    {
      "name": "my-cli",
      "version": "1.0.0",
      "bin": {
        "my-cli": "./lib/index.js"
      },
      "dependencies": {
        "commander": "^13.0.0"
      }
    }
    ```

- my-cli/lib/index-cli.js 配置代码（最小可运行）

  ```js
  #!/usr/bin/env node
  const { program } = require('commander');
  
  // 拿到 package 里面的 version
  const version = require('../package.json').version;
  
  program
    .name('my-cli')
    .version(version, '-v, --version')
    .option('-d, --debug', 'enable debug mode');
  
  program.on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  my-cli -v');
    console.log('  my-cli --help');
    console.log('  my-cli --debug');
  });
  
  program.parse(process.argv);
  ```

- `program.name('my-cli')` 作用

  - 用来设置 CLI 的“命令名”，主要会影响 `--help` 输出里的 `Usage:` 展示。
  - 如果你有子命令（例如 `my-cli create xxx`），子命令 help 的 `Usage:` 里也会以这个 name 作为前缀。
  - 不设置时 commander 会尝试从脚本文件名等信息推断，可能显示成 `why-cli.js` 之类，不够符合脚手架预期。

- `program.parse(process.argv)` 解释

  - 作用
    - 让 commander **去解析命令行参数**，并把解析结果写入 `program` 实例里。
    - 解析完成后，`-v/--version`、`--help`、以及你用 `.option()` 定义的参数才会真正生效。
  - `process.argv` 是什么
    - Node 里 `process.argv` 是命令行参数数组，形如：
      - `['node路径', '脚本路径', '用户参数1', '用户参数2', ...]`
    - 例如你执行：`my-cli --debug `
      - `process.argv` 大致是：
        - `['C:\\Program Files\\nodejs\\node.exe', '...\\why-cli.js', '--debug']`



### program的options配置

- 以 `--help` 举例

  - `--help`（以及 `-h`）是 commander **内置的 option**，即使你不写 `.option()`，也默认支持：
    - `my-cli --help`
  - 如果你想改 help 的 flags 或描述，可以用：
    - `program.helpOption('-H, --help', 'display help for command')`

- **自定义** options（以 `--dest/--why` 举例）

  - `program.option('-w, --why', 'a why cli program')`

    你现在已经看到 `-w` **有意义**了：你加了这段后 `whycli -w` 会打印 `why flag enabled`。

    ```js
    if (program.opts().why) {
      console.log('why flag enabled');
    }
    ```

    例子

    ##### 例子 1：`--skip-install`（控制是否安装依赖）

    ###### 需求

    - `create` 下载完模板后**默认自动安装依赖**
    - 但有人不想装（网络慢/想自己装），就传 `--skip-install`

    ###### 思路（伪代码）

    ```js
    program.option('--skip-install', 'skip installing dependencies');
    
    program.parse(process.argv);
    const opts = program.opts();
    
    if (!opts.skipInstall) {
      await installDependencies(projectPath);
    } else {
      console.log('skip install');
    }
    ```

    ###### 效果

    - `whycli create demo`  
      - 下载 + 自动 `pnpm i`
    - `whycli create demo --skip-install`  
      - 只下载，不装依赖

    ###### 回到你现在的 `-w/--why`：它应该控制什么？

    目前你只是打印一句话，所以你会觉得“意义不大”。你可以把 `--why` 当成一个真实用途，比如：

    - `--why` = 开启 verbose 日志（等价 debug）

    

  - `program.option('-d, --dest <dest>', 'a destination folder, 例如: -d src/components')`

    - `<dest>` 表示这个参数**必须带值**：
      - `my-cli --dest src/components` 解析结果：`opts.dest === 'src/components'`
      - 如果你希望“可选值”，写成 `[dest]`

  - 这两个 `.option()` 定义后：

    - 执行 `my-cli --help` 时，commander 会自动把它们显示到 help 的 options 列表里

- my-cli/lib/why-cli.js（示例）

  ```js
  #!/usr/bin/env node
  const { program } = require('commander');
  const version = require('../package.json').version;
  
  program
    .name('my-cli')
    .version(version, '-v, --version')
    .helpOption('-H, --help', 'display help for command')
    .option('-w, --why', 'a why cli program')
    .option('-d, --dest <dest>', 'a destination folder, 例如: -d src/components');
  
  program.parse(process.argv);
  
  const opts = program.opts();
  console.log('opts:', opts);// 这里面有你
  ```



### program的on配置

- 以 `--help` 举例
  - `program.on('--help', cb)`：当用户触发 help 时（`-h/--help`），在 commander 打印完帮助信息后，会再执行 `cb`这个回调函数。
  - 常见用途：补充 examples、展示扩展说明、输出额外文档链接等。



### 封装上面代码到core/help-options.js

- core/help-options.js

  ```js
  function registerHelpOptions(program) {
    program.helpOption('-h, --help', 'display help for command');
  
    program.on('--help', () => {
      console.log('');
      console.log('Examples:');
      console.log('  my-cli -v');
      console.log('  my-cli --help');
      console.log('  my-cli --debug');
    });
  }
  
  module.exports = {
    registerHelpOptions
  };
  ```

- 导入（my-cli/lib/index.js）

  ```js
  #!/usr/bin/env node
  const { program } = require('commander');
  const version = require('../package.json').version;
  const { registerHelpOptions } = require('../core/help-options');
  
  program
    .name('my-cli')
    .version(version, '-v, --version')
    .option('-d, --debug', 'enable debug mode');
  
  registerHelpOptions(program);
  
  program.parse(process.argv);
  ```

- 测试效果

  - `my-cli -v` 或 `my-cli --version`：输出版本号
  - `my-cli --help`：输出帮助信息（commander 自动生成）
  - `my-cli --debug`：解析 options





## 3.3.whycli create功能

### 实现whycli create hy-github-url

#### 1.安装commandar和下载github的方法

- 安装命令

  ```bash
  pnpm add commander download-git-repo
  ```

#### 2.使用commandar里面description,command和action

- my-cli/lib/why-cli.js（示例）

  ```js
  #!/usr/bin/env node
  const { program } = require('commander');
  const version = require('../package.json').version;
  const { createAction } = require('../core/actions');
  
  program
    .name('my-cli')
    .version(version, '-v, --version');
  
  program
    //.command('create <project> <repo>') // 你这把<repo>设置为了必传，则你执行命令的命令必须有远程连接，而一般远程连接放在本地，故不要用<repo>
    .command('create <project> ')
    .description('create a project from a github repo template')
    .action(createAction);
  
  program.parse(process.argv);
  ```

- 说明

  - `program.command('create <project> <repo>')`
    - 声明一个子命令 `create`。
    - `<project>`、`<repo>` 是必传参数。
    - 这里的 `project`、`repo` **不是固定写法**，只是“参数占位符名称”，你可以换成任意你喜欢的名字（例如 `<name>`、`<template>`）。
    - commander 语法规则
      - `<xxx>`：必传参数（required argument）
      - `[xxx]`：可选参数（optional argument）
    - `.action()` 回调参数顺序
      - `.action((project, repo) => {})` 里的形参顺序，来自 `command('create <project> <repo>')` 声明的参数顺序。
      - 例如你写 `command('create <name> <template>')`，那 action 里收到的就是 `(name, template)`。
  - `.description(...)`
    - 会显示在 `--help` 里，作为命令说明。
  - `.action(fn)`
    - 当用户执行 `my-cli create ...` 时，会调用 `fn(project, repo)`。

#### 3.action

- 使用node库中的promisfy

  - `util.promisify` 可以把它包装成 Promise 风格：
    - `const downloadAsync = promisify(download)`

- 使用

  - core/actions.js（示例）

    ```js
    const { promisify } = require('util');
    const download = require('download-git-repo');
    const { REPO } = require('../config');
    
    const downloadAsync = promisify(download);
    
    const createAction = async (project) => {
      await downloadAsync(REPO, project, { clone: false });
      console.log('create success:', project);
    };
    
    module.exports = {
      createAction
    };
    ```

    - repo配置

      ```js
      const REPO = "ljm399/update-hy-trip#main"
      module.exports = {
          REPO
      }
      ```

  - await downloadAsync(repo, project, { clone: false });三个参数解释

    - 第一个参数 `repo`
      - 你要下载的模板仓库标识（字符串）。
      - 常见写法：
        - `direct:https://github.com/xxx/yyy.git`
        - `xxx/yyy`（部分场景/配置下也可用）
    - 第二个参数 `project`
      - **下载到本地的目标目录**（字符串）。
      - 这里用的就是你 `create <project>` 传进来的项目名。
      - 因为 `download-git-repo` 的第二个参数本质是 `dest`（destination），表示“下载到哪里”。
    - 第三个参数 `{ clone: false }`
      - **`clone: false`**
        - 拿到的是“源码快照”（snapshot）
        - 通常没有 `.git`（没有提交历史、分支信息）
          - const REPO = "ljm399/update-hy-trip#main"
      - **`clone: true`**
        - 是完整仓库（包含 `.git`）
        - 能继续 `git log`、`git checkout`、`git pull` 等
          - const REPO = "direct:https://github.com/ljm399/update-hy-trip.git#main"
      - 使用默认就行就行
  
  - repo 参数怎么写（常见）

    - `direct:https://github.com/xxx/yyy.git`（direct 方式）

  - 示例命令

    - `my-cli create my-project direct:https://github.com/xxx/hy-github-url.git`



### createAction优化

#### 添加自动安装依赖功能

- 目标

  - `create` 下载模板完成后，自动执行一次依赖安装（如 `pnpm i` / `npm i` / `yarn`）。

- 核心点

  - 依赖安装要在目标项目目录执行，所以需要指定 `cwd`。
  - 安装依赖/启动 dev server 这类命令输出很多、时间也长，更推荐用 `spawn`：
    - 可以实时看到输出（把子进程 stdout/stderr pipe 到当前终端）
    - 不会像 `exec` 一样把输出先缓存在内存里（避免 buffer 限制导致截断）
  - 如果模板里没有 `package.json`，就没必要装依赖（通常直接跳过）。

- stdout/stderr补充作用

  - 每个进程一般都有两条输出通道：
    - `stdout`（standard output）：正常日志/输出
    - `stderr`（standard error）：错误/警告/诊断信息
  - 在脚手架里：
    - `childProcess.stdout/stderr` 是“子进程（pnpm i）”的输出
    - `process.stdout/stderr` 是“当前脚手架进程”的输出
  - `pipe` 的意义
    - 把子进程**输出实时转发到当前终端**，让用户看到安装进度/报错（像你手动敲命令一样）。
    - 同时保留错误输出语义：很多终端/CI 会对 `stderr` 做高亮或单独收集。

- utils/exec-command.js（封装 spawn）

  - spwn不用安装


  ```js
  const { spawn } = require('child_process');
  
  // 执行命令：spawn + Promise
  // command: 命令本身（例如 'pnpm'）
  // args: 参数数组（例如 ['i']）
  // options: spawn 选项（常用：cwd 指定工作目录）
  function execCommand(command, args, options) {
    // Promise 化，方便在 action 里使用 async/await
    return new Promise((resolve, reject) => {
      const finalCommand = process.platform === 'win32' ? `${command}.cmd` : command;
  
      // 1) 启动子进程
        // 当使用pnpm且win=32时，shell一般要设为true，否则报错
      const childProcess = spawn(finalCommand, args, {
        ...options,
        shell: process.platform === 'win32',
        windowsHide: true
      });
    	  
  
      // 2) 将子进程输出实时转发到当前终端
      // stdout：子进程的正常输出（进度条/日志等），pipe 到当前进程 stdout
      childProcess.stdout && childProcess.stdout.pipe(process.stdout);
      // stderr：子进程的错误输出（报错/警告等），pipe 到当前进程 stderr
      childProcess.stderr && childProcess.stderr.pipe(process.stderr);
  
      // 3) 子进程退出：code === 0 表示成功；否则认为失败
      childProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(String(code)));
      });
    });
  }
  
  module.exports = {
    execCommand
  };
  ```

- core/actions.js

  ```js
  const path = require('path');
  const fs = require('fs');
  const { promisify } = require('util');
  const download = require('download-git-repo');
  const { REPO } = require('../config');
  const { execCommand } = require('../utils/exec-command');
  
  const downloadAsync = promisify(download);
  
  const createAction = async (project) => {
    try {
      // 1.使命令whycli create xx有效
      await downloadAsync(REPO, project, { clone: false });
  
      // 2.先判断本地有无package.json,没有就跳过安装
      // process.cwd() 获取当前工作目录:即你在终端敲命令时所在的文件夹
      const projectPath = path.resolve(process.cwd(), project);
      const pkgPath = path.resolve(projectPath, 'package.json');
      if (!fs.existsSync(pkgPath)) {
        console.log('未检测到项目的 package.json，跳过安装依赖：', projectPath);
        console.log('create success:', project);
        return;
      }
  
  
      // 3.自动install
      await execCommand('pnpm', ['i'], { cwd: projectPath });
  
      // 4. 自动执行npm run dev
      await execCommand('pnpm', ['run', 'dev'], { cwd: projectPath });
  
      console.log('操作成功', project);  
    } catch (error) {
      console.log('操作失败');
      if (error && error.code) {
        console.log('error code:', error.code);
      }
    }
    
  };
  module.exports = {
    createAction
  };
  ```

- 说明

  - `cwd: projectPath`
    - 装在指定目录，否则会装到你当前目录。
  - `cmd` 选择
    - 这里示例写死 `pnpm i`，你也可以根据团队习惯切换成 `npm i` 或 `yarn`。
  - 输出
    - `spawn` 方式会把子进程输出实时打印到当前终端，更像你平时手动敲 `pnpm i` 的体验。





## 脚手架作用：在公司可以自己编写对应脚手架来快速使用工作内容

## 3.4.whycli addcpn + 组件名

### 效果:执行命令自动编写组件

- help-options.js

  - 目标：注册一个 `addcpn` 子命令
  - 示例

    ```js
    program
      .command('addcpn <name>')
      .description('create a vue component')
      .option('-d, --dest <dest>', 'a destination folder, 例如: -d src/components')
      .action(createComponentAction);
    ```

  - 说明
    - `<name>` 是必传参数（组件名）
    - `options.dest` 是可选参数（生成到哪个目录）

- core/action

  - `createComponentAction`（示例代码）

    ```js
    const path = require('path');
    const ejs = require('ejs');
    const { writeFile } = require('../utils/writeFile');
    
    async function createComponentAction(name, options) {
      // 1) 根据本地模板生成组件内容（使用 ejs 渲染）
      const templatePath = path.resolve(__dirname, '../templates/component.vue.ejs');
      const result = await ejs.renderFile(templatePath, { name,lowername:name.toLowerCase() });
    
      // 2) 将结果写入到对应文件夹（默认 src/components）
      const dest = options?.dest || 'src/components';//为什么dest有值，因为.option('-d, --dest <dest你设了这个，这个dest对应whycli addcpn vue-tample
      const targetPath = path.resolve(process.cwd(), dest, name, `${name}.vue`);// 要写如的对应文件完整路径
      await writeFile(targetPath, result);
    
      // 3) 打印成功日志
      console.log('create component success:', targetPath);
    }
    ```

  - 安装 ejs

    ```bash
    pnpm add ejs
    ```

  - 模板

    - templates

      - component.vue.ejs

    - 使用<%= %=>语法

      - 示例模板（`templates/component.vue.ejs`）

        ```ejs
        <template>
          <div class="<%= lowername %>">
            <%= name %>
          </div>
        </template>
        
        <script setup>
        </script>
        
        <style scoped>
        .<%= lowername %> {
        }
        </style>
        ```

      - 说明
        - template 根元素的 class 是动态的
        - style 里的选择器也根据组件名动态生成

- 编写wirteFile(utils/writeFlie)

  - 用 `fs.promises` 封装写文件（示例）

    ```js
    const fs = require('fs');
    const path = require('path');
    
    async function writeFile(targetPath, content) {
      // 自动创建目标文件夹
      const dir = path.dirname(targetPath);//从「文件完整路径」中提取文件夹路径（砍掉文件名，只留文件夹）
      await fs.promises.mkdir(dir, { recursive: true });//自动创建对应目录，而不用你来创建
    
      // 写入文件
      await fs.promises.writeFile(targetPath, content, 'utf8');
    }
    
    module.exports = {
      writeFile
    };
    ```



# 四。后台管理系统接口

- 那个图片之后截图
  - 标识符是角色接口和菜单接口

