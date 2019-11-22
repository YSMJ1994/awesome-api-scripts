'use strict';

const es = require('./es');
const lib = require('./lib');
const { parallel } = require('gulp');

exports.default = parallel(es, lib);
