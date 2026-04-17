'use strict';
const log = require('@zt-cli/log');

//init命令  InitCommand extends Command   zt-cli init ProjectName
//build 命令 BuildCommand extends Command  zt-cli build 参数
//publish 命令 PublishCommand extends Command  zt-cli publish

class Command {
  constructor(argv) {
    if (!argv) throw new Error('参数不能为空！');
    this._argv = argv;

    
    this.checkNodeVersion()
    this.initArgs()
    this.exec()
    // Promise 链式调用，控制生命周期
    // 你的三个方法必须按固定顺序执行，不能乱
    // 兼容「同步 + 异步」所有场景
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve(); // 
      chain = chain.then(() => this.checkNodeVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.exec());
      chain.catch(err => log.error('Command', err.message));
    });
  }

  checkNodeVersion() {
    log.verbose('Command', 'checkNodeVersion');
  }
  // 没办法写死，因为不同的命令，逻辑不一样
  initArgs() {
    throw new Error('initArgs 方法必须由业务子类自己实现！');
  }

  exec() {
    throw new Error('exec 方法必须由业务子类自己实现！');
  }
}

module.exports = Command;
