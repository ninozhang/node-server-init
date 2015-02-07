var express = require('express'),

    server = require('./server');

module.exports = function (dir) {
    dir = dir || '/public';
    
    var app = server.app;
    return express.static(app.get('root') + dir, {
        maxAge: app.get('env') === 'prod' ? Infinity : 0
    });
};