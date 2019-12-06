const path = require('path');
const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const { createReadStream, readFileSync } = require('fs');
const mime = require('mime');
const nunjucks = require('nunjucks');
const chalk = require('chalk');
const crypto = require('crypto');
class Server {
    constructor(config) {
        this.port = config.port;
        this.dir = config.dir;
    }
    async serverHandler(req, res) {
        let { pathname } = url.parse(req.url);
        pathname = decodeURIComponent(pathname);
        if(pathname === '/favicon.ico') return res.end(`Not Found`);
        let absPath = path.join(this.dir, pathname);
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
    hasCache(absPath, req, res, statObj) {
        // 强缓存10毫秒
        res.setHeader('Cache-Control', 'max-age=10'); 
        res.setHeader('Expires', new Date(Date.now() + 10*1000).toGMTString());
        
        // 协商缓存
        let ctime = statObj.ctime.toGMTString(); // 拿到文件变化的时间
        res.setHeader('Last-Modified', ctime);
        let content = readFileSync(absPath, 'utf8');
        let etag = crypto.createHash('md5').update(content).digest('base64');
        res.setHeader('Etag', etag);

        //第二次访问， 取值对比
        let ifModifiedSince = req.headers['if-modified-since'];
        if (ifModifiedSince != ctime) {
            return false;
        }
        let ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch != etag) {
            return false
        }
        return true;

    }
    sendFile(absPath, req, res, statObj) {
        if(this.hasCache(absPath, req, res, statObj)) {
            res.statusCode = 304;
            return res.end();
        }
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
            console.log(`${chalk.yellow('Starting up http-server, serving') }./${this.dir.split('/').pop()}
    Available on:
    http://127.0.0.1:${chalk.green(this.port)}
    Hit CTRL-C to stop the server`);
        })
    }
}

module.exports = Server;