var express = require('express'),

    router = express.Router();

router.get('*', function (req, res) {
    res.send('Hello World!');
});

module.exports = function (options) {
    router.options = options || {};
    return router;
};