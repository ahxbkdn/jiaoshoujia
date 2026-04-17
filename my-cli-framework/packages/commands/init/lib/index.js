'use strict';
const Command = require('@zt-cli/command');
const log = require('@zt-cli/log');
const Package = require('@zt-cli/package');

class InitCommand extends Command {
  initArgs() {
    this.projectName = this._argv[0] || '';
    this.options = this._argv[1] || {};
    this.force = !!this.options.force;
  }

  async exec() {
    try {
      const projectInfo = await this.prepare();
      if (projectInfo) {
        this.projectInfo = projectInfo;
        await this.downloadTemplate();
        await this.installTemplate();
      }
    } catch (e) {
      log.error('initCommand', e.message);
    }
  }

  async prepare() {
    const fse = require('fs-extra');
    const inquirer = require('inquirer');
    const localPath = process.cwd();

    if (!this.isCwdEmpty(localPath)) {
      let ifContinue = false;
      if (!this.force) {
        const answer = await inquirer.prompt([{
          type: 'confirm',
          name: 'ifContinue',
          default: false,
          message: '当前文件夹不为空，是否继续创建项目？'
        }]);
        ifContinue = answer.ifContinue;
        if (!ifContinue) return;
      }

      if (ifContinue || this.force) {
        const { confirmDelete } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirmDelete',
          default: false,
          message: '是否确认清空当前目录下的文件？(极其危险)'
        }]);
        if (confirmDelete) fse.emptyDirSync(localPath);
      }
    }
    return this.getProjectInfo();
  }

  isCwdEmpty(localPath) {
    const fs = require('fs');
    let fileList = fs.readdirSync(localPath);
    fileList = fileList.filter(file => !file.startsWith('.') && ['node_modules'].indexOf(file) < 0);
    return !fileList || fileList.length === 0;
  }

  async getTemplateList() {
    return [
      { name: 'Vue3 标准模板', npmName: '@zt-cli/vue-template', value: 'vue3', version: '1.0.0' },
      { name: 'React 中后台模板', npmName: '@zt-cli/react-template', value: 'react', version: '1.0.0' },
      { name: 'React 中后台模板', npmName: 'zt-react-admin-template-2026', value: 'react', version: '1.0.0' }
    ];
  }

  async getProjectInfo() {
    const inquirer = require('inquirer');
    const templateList = await this.getTemplateList();

    const answers = await inquirer.prompt([
      { type: 'input', name: 'projectName', message: '请输入项目名称', default: this.projectName || 'my-project' },
      { type: 'input', name: 'projectVersion', message: '请输入项目版本号', default: '1.0.0' },
      { 
        type: 'list', 
        name: 'projectTemplate', 
        message: '请选择项目模板', 
        choices: templateList.map(item => ({ name: item.name, value: item.value }))
      }
    ]);

    const selectedTemplate = templateList.find(item => item.value === answers.projectTemplate);
    return {
      ...answers,
      templateInfo: selectedTemplate
    };
  }

  async downloadTemplate() {
    const path = require('path');
    const userHome = require('user-home');
    const ora = require('ora');

    const { templateInfo } = this.projectInfo;
    const targetPath = path.resolve(userHome, '.zt-cli', 'dependencies');
    const storeDir = path.resolve(targetPath, 'node_modules');

    this.templatePkg = new Package({
      targetPath, storeDir,
      packageName: templateInfo.npmName,
      packageVersion: templateInfo.version
    });

    if (!await this.templatePkg.exists()) {
      const spinner = ora('正在下载模板...').start();
      try {
        await this.templatePkg.install();
        spinner.succeed('模板下载成功！');
      } catch (e) {
        spinner.fail('模板下载失败！');
        throw e;
      }
    } else {
      log.info('模板已存在，跳过下载');
    }
  }

  async installTemplate() {
    const fse = require('fs-extra');
    const path = require('path');

    const templatePath = path.resolve(this.templatePkg.targetPath, 'node_modules', this.templatePkg.packageName, 'template');
    const targetPath = process.cwd();
    fse.ensureDirSync(templatePath);
    fse.ensureDirSync(targetPath);
    fse.copySync(templatePath, targetPath);

    await this.ejsRender({ ignore: ['node_modules/**', 'public/**'] });

    log.info('正在安装依赖...');
    await this.execCommand('npm install', targetPath);
    log.info('依赖安装完成，正在启动...');
    await this.execCommand('npm run serve', targetPath);
  }

  async ejsRender(options = {}) {
    const ejs = require('ejs');
    const glob = require('glob');
    const fse = require('fs-extra');
    const path = require('path');
    const dir = process.cwd();

    return new Promise((resolve, reject) => {
      glob('**', { cwd: dir, ignore: options.ignore || '', nodir: true }, (err, files) => {
        if (err) reject(err);
        Promise.all(files.map(file => {
          const filePath = path.join(dir, file);
          return new Promise((resolve1, reject1) => {
            ejs.renderFile(filePath, this.projectInfo, {}, (err, result) => {
              if (err) { reject1(err); } 
              else { fse.writeFileSync(filePath, result); resolve1(result); }
            });
          });
        })).then(resolve).catch(reject);
      });
    });
  }

  async execCommand(commandStr, targetPath) {
    const cp = require('child_process');
    const cmdArray = commandStr.split(' ');
    const cmd = cmdArray[0];
    const args = cmdArray.slice(1);

    return new Promise((resolve, reject) => {
      const finalCmd = process.platform === 'win32' ? 'cmd' : cmd;
      const finalArgs = process.platform === 'win32' ? ['/c', cmd, ...args] : args;

      const child = cp.spawn(finalCmd, finalArgs, { cwd: targetPath, stdio: 'inherit' });
      child.on('exit', e => (e === 0 ? resolve() : reject(new Error('命令执行失败: ' + commandStr))));
    });
  }
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;
