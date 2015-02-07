var fs = require('fs'),
    path = require('path'),
    http = require('http'),

    express = require('express'),

    conf = require('./conf'),

    middleware = {
        compress: require('compression'),
        proxy: require('http-proxy'),
        combo: require('./combo'),
        router: require('./router'),
        static: require('./static'),
        error: require('./error')
    },

    app = express();

function init() {
    // 配置常用变量
    app.set('name', conf.name);
    app.set('version', conf.version);
    app.set('mode', conf.mode);
    app.set('root', conf.server.root);
    app.set('port', conf.server.port);
    app.set('logger', conf.logger);
    app.enable('trust proxy');

    // 启用代理
    if (conf.proxy.enabled) {
        app.use('/api/*', middleware.proxy(conf.proxy.host));
    }
    // 启用合并中间件
    app.use(middleware.combo());
    // 启用压缩中间件
    app.use(middleware.compress());
    // 启用静态中间件
    app.use(middleware.static());
    // 启用出错打印中间件
    app.use(middleware.error());
    // 启用路由
    app.use(middleware.router());

    return app.listen(app.get('port'), function () {
        app.get('logger').info('[%s] Express server listening on port %d',
            app.get('env').toUpperCase(), app.get('port'));
    });
}

exports.app = app;
exports.init = init;