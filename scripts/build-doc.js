process.env.NODE_ENV = 'production';
process.on('unhandledRejection', err => {
	throw err;
});
require('../config/env');
const webpack = require('webpack');
const chalk = require('chalk');
const formatWebpackMessages = require('../config/formatWebpackMessages.js');
const {docBuild, appPublic, appHtml} = require('../config/paths');
const { emptyDir } = require('../utils/fs');
const fs = require('fs-extra')
const config = require('../config/webpack.doc.prod');

function build() {
	const compiler = webpack(config);
	return new Promise((resolve, reject) => {
		compiler.run((err, stats) => {
			let messages;
			if (err) {
				if (!err.message) {
					return reject(err);
				}
				messages = formatWebpackMessages({
					errors: [err.message],
					warnings: []
				});
			} else {
				messages = formatWebpackMessages(stats.toJson({ all: false, warnings: true, errors: true }));
			}
			if (messages.errors.length) {
				if (messages.errors.length > 1) {
					messages.errors.length = 1;
				}
				return reject(new Error(messages.errors.join('\n\n')));
			}
			if (
				process.env.CI &&
				(typeof process.env.CI !== 'string' || process.env.CI.toLowerCase() !== 'false') &&
				messages.warnings.length
			) {
				console.log(
					chalk.yellow(
						'\nTreating warnings as errors because process.env.CI = true.\n' +
						'Most CI servers set it automatically.\n'
					)
				);
				return reject(new Error(messages.warnings.join('\n\n')));
			}

			return resolve({
				stats,
				warnings: messages.warnings
			});
		});
	})
}

async function start() {
	await emptyDir(docBuild);
	copyPublicFolder();
	console.log('正在构建api文档');
	build().then(({ stats, warnings }) => {
		if (warnings.length) {
			console.log(chalk.yellow('Compiled with warnings.\n'));
			console.log(warnings.join('\n\n'));
			console.log(
				'\nSearch for the ' +
				chalk.underline(chalk.yellow('keywords')) +
				' to learn more about each warning.'
			);
			console.log('To ignore, add ' + chalk.cyan('// eslint-disable-next-line') + ' to the line before.\n');
		} else {
			console.log(chalk.green('构建成功!'))
		}
	}).catch(err => {
		if (err && err.message) {
			console.log(err.message);
		}
		console.log(chalk.red('Failed to compile.\n'));
		process.exit(1);
	})
}

function copyPublicFolder() {
	fs.copySync(appPublic, docBuild, {
		dereference: true,
		filter: file => file !== appHtml
	});
}

module.exports = start
