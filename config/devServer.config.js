"use strict";

const path = require("path");
const escape = require("escape-string-regexp");
const fs = require("fs");
const {appSrc, appPublic, appProxySetup} = require('./paths')

function ignoredFiles(appSrc) {
	return new RegExp(
		`^(?!${escape(
			path.normalize(appSrc + "/").replace(/[\\]+/g, "/")
		)}).+/node_modules`,
		"g"
	);
}

const host = process.env.HOST || "0.0.0.0";

module.exports = function(proxy) {
	return {
		compress: true,
		clientLogLevel: "none",
		contentBase: appPublic,
		watchContentBase: true,
		hot: true,
		publicPath: "/",
		quiet: true,
		watchOptions: {
			ignored: ignoredFiles(appSrc)
		},
		https: false,
		disableHostCheck: true,
		host,
		overlay: true,
		historyApiFallback: {
			disableDotRule: true
		},
		proxy,
		before(app, server) {
			if (fs.existsSync(appProxySetup)) {
				require(appProxySetup)(app);
			}
		}
	};
};
