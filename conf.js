var fs = require('fs'),
    path = require('path');

function readJSON(filename) {
    var dir = __dirname,
        content,
        p;

    // 向上找 3 层目录
    for (var i = 0; i < 3; i++) {
        p = path.resolve(dir, filename);
        if (fs.existsSync(p)) {
            content = fs.readFileSync(p);
            break;
        }
        dir += '../'
    }

    // 解析 JSON
    return JSON.parse(content);
}

function init() {
    var pack = readJSON('package.json'),
        config = readJSON('conf.json');

    if (pack.name) {
        config.name = pack.name;
    }
    if (pack.version) {
        config.version = pack.version;
    }

    for (var key in config) {
        exports[key] = config[key];
    }
}

init();