const path = require('path');
const fs = require('fs-extra');

const targetRoot = process.cwd();
const toolRoot = path.resolve(__dirname, '../');
const moduleFileExtensions = ['web.mjs', 'mjs', 'web.js', 'js', 'ts', 'json', 'web.jsx', 'jsx', 'tsx'];

function resolveTarget(relativePath) {
	return path.resolve(targetRoot, relativePath);
}

function resolveTool(relativePath) {
	return path.resolve(toolRoot, relativePath);
}

const resolveModule = (resolveFn, filePath) => {
	const extension = moduleFileExtensions.find(extension => fs.existsSync(resolveFn(`${filePath}.${extension}`)));

	if (extension) {
		return resolveFn(`${filePath}.${extension}`);
	}

	return resolveFn(`${filePath}.js`);
};

module.exports = {
	targetRoot,
	toolRoot,
	docBuild: resolveTarget('dist-doc'),
	targetPkg: resolveTarget('package.json'),
	appBase: resolveTarget('src/app'),
	docBase: resolveTarget('src/doc'),
	appSrc: resolveTarget('src'),
	appPublic: resolveTarget('public'),
	appIndexJs: resolveModule(resolveTarget, 'src/app/index'),
	docIndexJs: resolveModule(resolveTarget, 'src/doc/index'),
	appHtml: resolveTarget('public/index.html'),
	appProxySetup: resolveTarget('src/app/proxy.js'),
	moduleFileExtensions,
	resolveTarget,
	resolveTool,
};
