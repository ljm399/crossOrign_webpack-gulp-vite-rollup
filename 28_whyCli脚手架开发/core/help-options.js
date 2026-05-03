const { createAction, createComponentAction } = require('./action');

function registerHelpOptions(program) {
    const version = require('../package.json').version;

    program
    .name('my-cli')
    .version(version, '-v, --version')
    //   .option('-d, --debug', 'enable debug mode')
    .helpOption('-H, --help', 'display help for command')
    .option('-w, --why', 'a why cli program')
    .option('-d, --dest <dest>', 'a destination folder, 例如: -d src/components');

  program.on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  my-cli -v');
    console.log('  my-cli --help');
    console.log('  my-cli --debug');
  });

  
  program
  .command('create <project>')
  .description('create a project from a github repo template')
  .action(createAction);

  program
  .command('addcpn <name>')
  .description('create a vue component')
  .option('-d, --dest <dest>', 'a destination folder, 例如: -d src/components')
  .action(createComponentAction);
}

module.exports = {
  registerHelpOptions
};