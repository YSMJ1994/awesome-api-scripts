"use strict";
const through2 = require("through2");

module.exports = function plugin(resolver) {
    return through2.obj(async function(file, _, cb) {
        const f = await resolver(file);
        cb(null, f || file);
    });
}
