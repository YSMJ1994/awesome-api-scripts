"use strict";
const paths = require("../config/paths");
const path = require("path");
const { exists } = require("../utils/fs");
const { spawn } = require("child_process");
const chalk = require("chalk");
const { targetRoot, toolRoot, targetPkg } = paths;
const { name } = require(targetPkg);

module.exports = async function start() {
	const targetGulpBinPath = path.resolve(targetRoot, "node_modules/.bin/gulp");
	const toolGulpBinPath = path.resolve(toolRoot, "node_modules/.bin/gulp");
	let gulpBin = exists(targetGulpBinPath)
		? targetGulpBinPath
		: exists(toolGulpBinPath)
			? toolGulpBinPath
			: null;
	if (!gulpBin) {
		console.error("not found gulp!");
		process.exit(1);
	}
	const gulpConfig = path.resolve(toolRoot, "Gulpfile.js");
	return new Promise((resolve, reject) => {
		const gulp = spawn(gulpBin, ["-f", gulpConfig, "--cwd", targetRoot], {
			stdio: "inherit"
			// stdio: "ignore"
		});
		gulp.on("close", function() {
			console.log();
			console.log(`生成 api库 [ ${chalk.greenBright(name)} ] 成功!`);
			resolve();
		});
		gulp.on("error", function(err) {
			console.error(err);
			console.log(`generate library [ ${chalk.greenBright(name)} ] failed!`);
			reject();
		});
	});
};
