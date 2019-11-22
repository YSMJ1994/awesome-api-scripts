const nodePath = require("path");
function path2GulpPath(path) {
	if (!path || typeof path !== "string") {
		throw new Error(`invalid argument: path[ ${path} ]`);
	}
	return path.split(nodePath.sep).join("/");
}

module.exports = {
	path2GulpPath
}
