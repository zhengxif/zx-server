#!/usr/bin/env node

let program = require('commander');
let configs = {
    '-p, --port <val>': 'set http-server port',
    '-d, --dir <dir>': 'set http-server directory'
}
Object.entries(configs).forEach(([key, value]) => {
    program.option(key, value);
})

program.name("zx-server").usage('<options>');
program.on('--help', function() {
    console.log('Examples:');
    console.log(`  $ zx-server --port 3000`);
})
let params = program.parse(process.argv); // 用户传过来的参数

const Server = require('../static-server');
let defaultConfig = {
    port: 4000,
    dir: process.cwd(),
    ...params
}
let server = new Server(defaultConfig);
server.start();