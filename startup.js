var fs = require('fs'),
    path = require('path'),
    cluster = require('cluster'),
    os = require('os'),
    express = require('express'),
    commander = require('commander'),

    server = require('./server'),
    conf = require('./conf'),
    logger = require('./logger'),

    numCPUs = os.cpus().length,
    maxClusterCount = numCPUs * 2,
    clusterCount = Number(conf.cluster.count) || 1,

    app = server.app,

    DEV = 'dev',
    PROD = 'prod',

    modes = {
        dev: ['develop', 'dev'],
        prod: ['production', 'prod']
    },

    worker,
    address,
    port,
    pidFile,
    mode,
    root;

function detectMode(m) {
    if (!m) {
        return;
    }
    
    var _m = m.toLowerCase();
    for (var key in modes) {
        if (modes[key].indexOf(key) > -1) {
            return key;
        }
    }
    return DEV;
}

function start() {
    logger.info('starting server ..');

    if (clusterCount <= 1) {
        // 创建新的服务器
        worker = server.init();

    } else {
        // 超过 CPU 核心数设置为和 CPU 核心数相同
        if (clusterCount > maxClusterCount) {
            logger.error('clusterCount ', clusterCount, ' is larger than maxClusterCount ', maxClusterCount);
            clusterCount = maxClusterCount;
            logger.info('set clusterCount to ', clusterCount);
        }

        if (cluster.isMaster) {
            // 创建服务器
            for (var i = 0; i < clusterCount; i++) {
                cluster.fork();
            }

            // 进程异常退出处理
            cluster.on('exit', function(worker, code, signal) {
                logger.error('worker ' + worker.process.pid + ' died');
                logger.error('code ', code);
                logger.error('signal', signal);
                var newCluster = cluster.fork();
                log.info('new cluster pid ', newCluster.process.pid);
            });
        } else {
            // Workers can share any TCP connection
            // In this case its a HTTP server
            // 创建新的服务器
            worker = server.init();
        }
    }

    // 获取地址
    if (worker) {
        address = worker.address();
    }

    logger.info('CPU Count', numCPUs);
    logger.info('Cluster Count', clusterCount);
    logger.info('Server Mode', mode);
    logger.info('Listening on', port);
    logger.info('pid', process.pid);

    // 如果是非开发模式，需要捕获未捕获异常
    if (mode !== DEV) {
        process.on('uncaughtException', function (e) {
            logger.error('Caught exception:', e.stack);
        });
    }

    if (pidFile) {
        fs.writeFileSync(pidFile, process.pid);
        process.on('SIGINT', function () {
            if (fs.existsSync(pidFile)) {
                fs.unlinkSync(pidFile);
            }
            process.kill(process.pid);
        });
    }
}

if (require.main === module) {
    // 配置命令行参数
    commander.option('-p, --port <number>', 'server port')
        .option('-P, --pidfile <path>', 'path of pidfile')
        .option('-m, --mode <dev|prod>', 'server mode')
        .parse(process.argv);

    logger.info('detecting environment ..');

    logger.info('commander.port', commander.port);
    logger.info('commander.pidfile', commander.pidfile);
    logger.info('commander.mode', commander.mode);
    logger.info('process.env.PORT', process.env.PORT);

    logger.info('configuring ..');

    // 端口取用优先级
    // 从启动参数中获取
    if (commander.port) {
        try {
            port = Number(commander.port);
        } catch(e) {
            logger.warn('commander.port parse error', e);
        }
    }
    // 从环境变量中获取
    if (!port && process.env.PORT) {
        try {
            port = Number(process.env.PORT);
        } catch(e) {
            logger.warn('process.env.PORT parse error', e);
        }
    }
    // 从配置文件获取
    if (!port && conf.server.port) {
        port = conf.server.port;
    }
    // 默认 5000
    if (!port) {
        port = 5000;
    }
    logger.info('server port', port);

    // pidFile
    pidFile = commander.pidfile;

    // 从命令行参数中读取，如果没有就默认设置为开发环境
    if (commander.mode) {
        mode = detectMode(commander.mode);
    }
    // 尝试读取 UAE 环境变量
    if (!mode && process.env.MODE) {
        mode = detectMode(process.env.MODE);
    }
    // 默认为开发模式
    if (!mode) {
        mode = DEV;
    }
    logger.info('server mode', mode);

    // 读取根路径
    if (conf.server.root) {
        root = path.resolve(conf.server.root);
    }
    if (!root) {
        root = path.resolve(__dirname, '../').replace(/\/+$/, '');
    }
    logger.info('root', root);

    // 将参数放到配置中
    conf.mode = mode;
    conf.server.root = root;
    conf.server.port = port;
    conf.logger = logger;

    // 启动服务器
    start();
}