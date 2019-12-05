#!/usr/bin/env node

const Server = require('../static-server');


let server = new Server({ port: 4000 });
server.start();