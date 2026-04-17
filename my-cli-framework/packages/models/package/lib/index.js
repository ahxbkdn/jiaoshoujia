'use strict';

const path = require('path');
const npminstall = require('npminstall');
const pathExists = require('path-exists').pathExistsSync;

class Package {
  constructor(options) {
    if (!options) throw new Error('Package类的options参数不能为空！');
    this.targetPath = options.targetPath;
    this.storeDir = options.storeDir;
    this.packageName = options.packageName;
    this.packageVersion = options.packageVersion;
  }

  exists() {
    return this.storeDir ? pathExists(this.storeDir) : pathExists(this.targetPath);
  }

  async install() {
    await npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: 'https://registry.npmmirror.com',
      pkgs: [{ name: this.packageName, version: this.packageVersion }]
    });
  }
}

module.exports = Package;
