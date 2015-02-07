var errorHandler = require('errorhandler'),
    server = require('./server');

module.exports = function () {
    var app = server.app,
        logger = app.get('logger') || console;
    return app.get('env') === 'prod' ?
        function (err, req, res, next) {
            var msg = err.stack;
            if (err.mod) {
                msg = '[' + err.mod + '] ' + msg;
            }
            logger.error(msg);

            if (err.status) {
                res.statusCode = err.status;
            }
            if (res.statusCode < 400) {
                res.statusCode = 500;
            }
            res.end();
        } : errorHandler();
};