const core = require('../lib/core');
const log = require('@zt-cli/log');
const path = require('path');
const pathExists = require('path-exists');

jest.mock('@zt-cli/log', () => ({
  success: jest.fn(),
  verbose: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}));

describe('@zt-cli/core', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('环境准备测试', () => {

    it('1. 测试包版本检查 (checkPkgVersion)', () => {
      try {
        core();
      } catch (e) {
      }

      const pkg = require('../package.json');
      expect(log.success).toHaveBeenCalledWith("CLI 版本号:", pkg.version);
    });

    it('2. 测试 Node 版本检查 (checkNodeVersion) - 低版本拦截', () => {
      const semver = require('semver');
      const originalGte = semver.gte;
      semver.gte = jest.fn().mockReturnValue(false);

      try {
        core();
      } catch (e) {
        expect(e.message).toMatch(/zt-cli 需要安装 Node\.js/);
      }

      semver.gte = originalGte;
    });

    it('3. 测试用户主目录检查 (checkUserHome)', () => {
      const userHome = require('user-home');
      expect(userHome).toBeDefined();
      expect(pathExists.sync(userHome)).toBe(true);
    });

    it('4. 测试入参解析与环境变量设置 (checkInputArgs) - debug模式', () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'zt-cli', '--debug'];

      const semver = require('semver');
      const originalGte = semver.gte;
      semver.gte = jest.fn().mockReturnValue(true);

      try {
        core();
      } catch (e) {
      }

      expect(process.env.LOG_LEVEL).toBe('verbose');
      expect(log.level).toBe('verbose');

      process.argv = originalArgv;
      semver.gte = originalGte;
    });

    it('5. 测试环境变量文件加载 (checkEnv)', () => {
      try { 
        core(); 
      } catch (e) { 
      }

      const envPath = path.resolve(__dirname, '../.env');

      if (pathExists.sync(envPath)) {
        expect(log.verbose).toHaveBeenCalledWith(expect.stringContaining("环境变量已加载"), expect.anything());
      } else {
        expect(log.verbose).toHaveBeenCalledWith("环境变量文件不存在");
      }
    });

  });
});
