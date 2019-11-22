process.env.NODE_ENV = 'test';
process.on('unhandledRejection', err => {
	throw err;
});
require('../config/env');
const { spawn } = require('child_process');
const { resolveTarget } = require('../config/paths');
import { exists } from '../utils/fs'

const jestBinPath = resolveTarget('node_modules/.bin/jest');

module.exports = function start(args) {
	if(exists(jestBinPath)) {
		const jestProcess = spawn(jestBinPath, args, {
			stdio: 'inherit'
			// stdio: "ignore"
		});

		jestProcess.on('close', function() {
			console.log('test end');
		});
	}
};
