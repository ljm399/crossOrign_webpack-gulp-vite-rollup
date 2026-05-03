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