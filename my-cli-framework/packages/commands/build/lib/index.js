'use strict';
const Command = require('@zt-cli/command');
const log = require('@zt-cli/log');

class BuildCommand extends Command {
  initArgs() {
    this.projectName = this._argv[0] || '';
    this.options = this._argv[1] || {};
    this.force = !!this.options.force;
    log.verbose('[BuildCommand] 成功接收到参数：', this._argv);
  }
  exec() {
    log.info('[BuildCommand] 开始执行项目构建与打包逻辑...');
    // 这里可以添加具体的构建逻辑
    log.success('[BuildCommand] 项目构建完成！');
  }
}

function build(argv) {
  return new BuildCommand(argv);
}

module.exports = build;
