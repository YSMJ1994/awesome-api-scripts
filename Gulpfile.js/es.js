const fs = require('fs-extra');
const { src, dest, series } = require('gulp');
const { path2GulpPath } = require('./utils');
const { appSrc, resolveTarget } = require('../config/paths');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json', {
	target: 'esnext',
	module: 'esnext',
	declaration: true,
	noEmit: false,
	isolatedModules: false,
	allowJs: false
});

const root = appSrc;
const outDest = path2GulpPath(resolveTarget('es'));

const ignore = [`!${root}/app/`, `!${root}/doc/`];

async function clean() {
	fs.ensureDirSync(outDest);
	await fs.emptyDir(outDest);
}

async function resolveEs() {
	const stream = src([`${root}/**/*.ts`, `${root}/**/*.tsx`, ...ignore]).pipe(tsProject());
	await stream.js.pipe(dest(outDest));
	await stream.dts.pipe(dest(outDest));
}

function resolveDTS() {
	return src([`${root}/**/*.d.ts`, ...ignore]).pipe(dest(outDest));
}

function resolveOthers() {
	return src([`${root}/**/*`, `!${root}/**/*.ts`, `!${root}/**/*.tsx`, ...ignore]).pipe(dest(outDest));
}

module.exports = series(clean, resolveEs, resolveDTS, resolveOthers);
