'use strict';

const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const NODE_ENV = process.env.NODE_ENV;
const DOT_ENV = process.env.DOT_ENV || '__unknown_';
if (!NODE_ENV) {
	throw new Error('The NODE_ENV environment variable is required but was not specified.');
}
const readFile = function(filePath) {
	return fs.readFileSync(filePath, { encoding: 'utf-8' });
};

let dotenvConfig = {};
const dotenvFiles = ['.env', `.env.local`, `.env.${NODE_ENV}`, `.env.${NODE_ENV}.local`,  `.env.${DOT_ENV}`, `.env.${DOT_ENV}.local`].map(n =>
	path.resolve(process.cwd(), n)
);
dotenvFiles.forEach(dotenvFile => {
	if (fs.existsSync(dotenvFile)) {
		const envConfig = dotenv.parse(readFile(dotenvFile));
		dotenvConfig = {
			...dotenvConfig,
			...envConfig
		};
	}
});

Object.keys(dotenvConfig).forEach(key => {
	process.env[key] = dotenvConfig[key];
});

const raw = {
	...dotenvConfig,
	NODE_ENV,
	DOT_ENV
};
const stringified = {
	'process.env': Object.keys(raw).reduce((env, key) => {
		env[key] = JSON.stringify(raw[key]);
		return env;
	}, {})
};
module.exports = { raw, stringified };
