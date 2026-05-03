const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const ejs = require('ejs');
const download = require('download-git-repo');
const { REPO } = require('../config');
const { execCommand } = require('../utils/exec-command');
const { writeFile } = require('../utils/writeFile');

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

    // 4. 帮助执行npm run dev
    await execCommand('pnpm', ['run', 'dev'], { cwd: projectPath });

    console.log('操作成功', project);  
  } catch (error) {
    console.log('操作失败');
    if (error && error.code) {
      console.log('error code:', error.code);
    }
  }
  
};

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

module.exports = {
  createAction,
  createComponentAction
};