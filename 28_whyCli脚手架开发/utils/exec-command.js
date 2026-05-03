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