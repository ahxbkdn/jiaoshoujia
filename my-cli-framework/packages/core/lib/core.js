'use strict';

const { Command } = require('commander');
const log = require('@zt-cli/log');
const pkg = require('../package.json');
const semver = require('semver');
const colors = require('colors');
const constant = require('./const');
const userHome = require('user-home');
const pathExists = require('path-exists');
const minimist = require('minimist');
const path = require('path');

const program = new Command();

function core(args) {
  checkPkgVersion();

  try {
    checkNodeVersion();
    checkUserHome();
    checkInputArgs();
    checkEnv();
    registerCommand();
  } catch (err) {
    log.error(err.message);
  }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false);

  program.on('option:debug', function() {
    if (program.opts().debug) {
      process.env.LOG_LEVEL = 'verbose';
      log.level = process.env.LOG_LEVEL;
      log.verbose('debug模式已开启');
    }
  });

  program
    .command('init [projectName]')
    .description('初始化一个项目')
    .option('-f, --force', '是否强制初始化项目')
    .action((projectName, cmdObj) => {
      const initCommand = require('@zt-cli/init');
      initCommand([projectName, cmdObj]);
    });

  program
    .command('build [projectName]')
    .description('构建并打包一个项目')
    .option('-f, --force', '是否强制打包')
    .action((projectName, cmdObj) => {
      const buildCommand = require('@zt-cli/build');
      buildCommand([projectName, cmdObj]);
    });

  program.on('command:*', function(obj) {
    const availableCommands = program.commands.map(cmd => cmd.name());
    console.log(colors.red('未知的命令: ' + obj[0]));
    if (availableCommands.length > 0) {
      console.log(colors.green('可用命令: ' + availableCommands.join(',')));
    }
  });

  // 检查是否在测试环境中
  const isTest = process.env.NODE_ENV === 'test' || process.argv.includes('--test');
  
  if (!isTest) {
    program.parse(process.argv);
    if (program.args && program.args.length < 1) {
      program.outputHelp();
    }
  }
}

function checkPkgVersion() {
  log.success("CLI 版本号:", pkg.version);
}

function checkNodeVersion() {
  const currentVersion = process.version;
  const lowestVersion = constant.LOWEST_NODE_VERSION;

  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`zt-cli 需要安装 Node.js ${lowestVersion} 以上版本，当前 Node 版本 ${currentVersion} 低于最低版本 ${lowestVersion}`));
  }
}

function checkUserHome() {
  if (!userHome || !pathExists.sync(userHome)) {
    throw new Error(colors.red(`用户主目录不存在，无法继续执行`));
  }
}

function checkInputArgs() {
  const args = minimist(process.argv.slice(2));
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose';
  } else {
    process.env.LOG_LEVEL = 'info';
  }
  log.level = process.env.LOG_LEVEL;
}

function checkEnv() {
  const dotenv = require('dotenv');
  const envPath = path.resolve(__dirname, '../../.env');

  if (pathExists.sync(envPath)) {
    const config = dotenv.config({ path: envPath });
    log.verbose("环境变量已加载:", config);
  } else {
    log.verbose("环境变量文件不存在");
  }
}

module.exports = core;