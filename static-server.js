const path = require('path');
const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const { createReadStream } = require('fs');
const mime = require('mime');
const nunjucks = require('nunjucks');

class Server {
    constructor(config) {
        this.port = config.port;
        this.dir = config.dir;
    }
    async serverHandler(req, res) {
        let { pathname } = url.parse(req.url);
        pathname = decodeURIComponent(pathname);
        if(pathname === '/favicon.ico') return res.end(`Not Found`);
        let absPath = path.join(__dirname, pathname);
        try {
            let statObj = await fs.stat(absPath);
            if (statObj.isFile()) {
                this.sendFile(absPath, req, res, statObj);
            } else {
                // 需要列出所有文件夹内容
                let children = await fs.readdir(absPath);
                children = children.map(item => ({
                    current: item,
                    parent: path.join(pathname, item)
                }));
                let str = nunjucks.render(path.resolve(__dirname, 'template.html'), { data: children });
                res.setHeader('Content-type', 'text/html;charset=utf-8');
                res.end(str);
            }
        } catch (error) {
            console.log(error);
            this.sendError(error, res)
        }
    }
    sendFile(absPath, req, res, statObj) {
        res.setHeader('Content-type', mime.getType(absPath) + ";charset=utf-8");
        createReadStream(absPath).pipe(res);
    }
    sendError(err, res) {
        res.statusCode = 404;
        res.end('Not found');
    }
    start() {
        let server = http.createServer(this.serverHandler.bind(this));
        server.listen(this.port, () => {
            console.log('启动成功');
        })
    }
}

module.exports = Server;