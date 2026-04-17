'use strict';

const log = require("npmlog")
log.level = process.env.LOG_LEVEL || "info" 
log.heading = "zhentao"

// 自定义 success 等级，用于输出成功信息
log.addLevel("success", 2000, {fg:"green",bg:"black",bold:true})
// 自定义 debug 等级，用于输出调试信息，最低级别
log.addLevel("debug", 1000, {fg:"blue",bg:"black",bold:true})

module.exports = log;