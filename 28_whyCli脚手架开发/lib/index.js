#!/usr/bin/env node
const { program } = require('commander');
const { registerHelpOptions } = require('../core/help-options');

// 拿到 package 里面的 version
// const version = require('../package.json').version;

// program
//   .name('my-cli')
//   .version(version, '-v, --version')
// //   .option('-d, --debug', 'enable debug mode')
//   .helpOption('-H, --help', 'display help for command')
//   .option('-w, --why', 'a why cli program')
//   .option('-d, --dest <dest>', 'a destination folder, 例如: -d src/components');


// program.on('--help', () => {
//   console.log('');
//   console.log('Examples:');
//   console.log('  my-cli -v');
//   console.log('  my-cli --help');
//   console.log('  my-cli --debug');
// });
registerHelpOptions(program)

program.parse(process.argv);
// console.log(program.opts().dest);
if (program.opts().why) {
  console.log('why flag enabled');
}