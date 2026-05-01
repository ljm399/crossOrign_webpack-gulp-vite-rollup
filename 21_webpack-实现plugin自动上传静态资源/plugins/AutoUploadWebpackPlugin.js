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