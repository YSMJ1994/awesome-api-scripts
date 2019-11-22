process.env.NODE_ENV = 'development';
process.on('unhandledRejection', err => {
	throw err;
});
require('../config/env');

const chalk = require('chalk');
const inquirer = require('inquirer');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('../config/webpack.config');
const createDevServerConfig = require('../config/devServer.config');
const createCompiler = require('../config/createCompiler')
const detect = require('detect-port');

const HOST = process.env.HOST || 'localhost';
const DEFAULT_PORT = parseInt(process.env.PORT || '', 10) || 4000;
const isInteractive = process.stdout.isTTY;

function isRoot() {
	return process.getuid && process.getuid() === 0;
}
function clearConsole() {
	process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}

function choosePort(host, defaultPort) {
	return detect(defaultPort, host).then(port => {
		return new Promise(resolve => {
			if (port == defaultPort) {
				return resolve(port);
			} else {
				const message =
					process.platform !== 'win32' && defaultPort < 1024 && !isRoot()
						? `1024以下的端口需要admin权限.`
						: `端口 ${defaultPort}已经被占用了.`;
				if (isInteractive) {
					clearConsole();
					const question = {
						type: 'confirm',
						name: 'shouldChangePort',
						message: chalk.yellow(message) + '\n\n你想在另一个端口启动吗?',
						default: true
					};
					inquirer.prompt(question).then(answer => {
						if (answer.shouldChangePort) {
							resolve(port);
						} else {
							resolve(null);
						}
					});
				} else {
					console.log(chalk.red(message));
					resolve(null);
				}
			}
		});
	});
}

function start() {
	choosePort(HOST, DEFAULT_PORT)
		.then(port => {
			if (!port) {
				return;
			}
			const devSocket = {
				warnings: warnings => devServer.sockWrite(devServer.sockets, 'warnings', warnings),
				errors: errors => devServer.sockWrite(devServer.sockets, 'errors', errors)
			};
			if (isInteractive) {
				clearConsole();
			}
			console.log(chalk.cyan('Starting the development server...\n'));
			const compiler = createCompiler({
				config: webpackConfig,
				devSocket,
				urls: {host: HOST, port},
				useTypeScript: true,
				webpack
			})
			const serverConfig = createDevServerConfig();
			const devServer = new WebpackDevServer(compiler, serverConfig);
			devServer.listen(port, err => {
				if (err) {
					console.log(err);
				}
			});

			['SIGINT', 'SIGTERM'].forEach(function(sig) {
				process.on(sig, function() {
					devServer.close();
					process.exit();
				});
			});
		})
		.catch(err => {
			if (err && err.message) {
				console.log(err.message);
			}
			process.exit(1);
		});
}

module.exports = start
