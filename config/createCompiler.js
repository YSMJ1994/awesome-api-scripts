
const chalk = require('chalk');
const formatWebpackMessages = require('./formatWebpackMessages');
const typescriptFormatter = require('./typescriptFormatter');
const forkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const isInteractive = process.stdout.isTTY;

function clearConsole() {
	process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}

function printInstructions(host, port) {
	console.log();
	console.log(`You can now view App in the browser.`);
	console.log();
	console.log(`  ${chalk.bold('Local:')}            http://${host}:${port}`);

	console.log();
}

function createCompiler({ config, devSocket, urls, useTypeScript, webpack }) {
	// "Compiler" is a low-level interface to Webpack.
	// It lets us listen to some events and provide our own custom messages.
	let compiler;
	try {
		compiler = webpack(config);
	} catch (err) {
		console.log(chalk.red('Failed to compile.'));
		console.log();
		console.log(err.message || err);
		console.log();
		process.exit(1);
	}

	// "invalid" event fires when you have changed a file, and Webpack is
	// recompiling a bundle. WebpackDevServer takes care to pause serving the
	// bundle, so if you refresh, it'll wait instead of serving the old one.
	// "invalid" is short for "bundle invalidated", it doesn't imply any errors.
	compiler.hooks.invalid.tap('invalid', () => {
		if (isInteractive) {
			clearConsole();
		}
		console.log('Compiling...');
	});

	let isFirstCompile = true;
	let tsMessagesPromise;
	let tsMessagesResolver;

	if (useTypeScript) {
		compiler.hooks.beforeCompile.tap('beforeCompile', () => {
			tsMessagesPromise = new Promise(resolve => {
				tsMessagesResolver = msgs => resolve(msgs);
			});
		});

		forkTsCheckerWebpackPlugin
			.getCompilerHooks(compiler)
			.receive.tap('afterTypeScriptCheck', (diagnostics, lints) => {
				const allMsgs = [...diagnostics, ...lints];
				const format = message => `${message.file}\n${typescriptFormatter(message, true)}`;

				tsMessagesResolver({
					errors: allMsgs.filter(msg => msg.severity === 'error').map(format),
					warnings: allMsgs.filter(msg => msg.severity === 'warning').map(format)
				});
			});
	}

	// "done" event fires when Webpack has finished recompiling the bundle.
	// Whether or not you have warnings or errors, you will get this event.
	compiler.hooks.done.tap('done', async stats => {
		if (isInteractive) {
			clearConsole();
		}

		// We have switched off the default Webpack output in WebpackDevServer
		// options so we are going to "massage" the warnings and errors and present
		// them in a readable focused way.
		// We only construct the warnings and errors for speed:
		// https://github.com/facebook/create-react-app/issues/4492#issuecomment-421959548
		const statsData = stats.toJson({
			all: false,
			warnings: true,
			errors: true
		});

		if (useTypeScript && statsData.errors.length === 0) {
			const delayedMsg = setTimeout(() => {
				console.log(chalk.yellow('Files successfully emitted, waiting for type check results...'));
			}, 100);

			const messages = await tsMessagesPromise;
			clearTimeout(delayedMsg);
			statsData.errors.push(...messages.errors);
			statsData.warnings.push(...messages.warnings);

			// Push errors and warnings into compilation result
			// to show them after page refresh triggered by user.
			stats.compilation.errors.push(...messages.errors);
			stats.compilation.warnings.push(...messages.warnings);

			if (messages.errors.length > 0) {
				devSocket.errors(messages.errors);
			} else if (messages.warnings.length > 0) {
				devSocket.warnings(messages.warnings);
			}

			if (isInteractive) {
				clearConsole();
			}
		}

		const messages = formatWebpackMessages(statsData);
		const isSuccessful = !messages.errors.length && !messages.warnings.length;
		if (isSuccessful) {
			console.log(chalk.green('Compiled successfully!'));
		}
		if (isSuccessful && (isInteractive || isFirstCompile)) {
			const { host, port } = urls;
			printInstructions(host, port);
		}
		isFirstCompile = false;

		// If errors exist, only show errors.
		if (messages.errors.length) {
			// Only keep the first error. Others are often indicative
			// of the same problem, but confuse the reader with noise.
			if (messages.errors.length > 1) {
				messages.errors.length = 1;
			}
			console.log(chalk.red('Failed to compile.\n'));
			console.log(messages.errors.join('\n\n'));
			return;
		}

		// Show warnings if no errors were found.
		if (messages.warnings.length) {
			console.log(chalk.yellow('Compiled with warnings.\n'));
			console.log(messages.warnings.join('\n\n'));

			// Teach some ESLint tricks.
			console.log(
				'\nSearch for the ' + chalk.underline(chalk.yellow('keywords')) + ' to learn more about each warning.'
			);
			console.log('To ignore, add ' + chalk.cyan('// eslint-disable-next-line') + ' to the line before.\n');
		}
	});

	// You can safely remove this after ejecting.
	// We only use this block for testing of Create React App itself:
	const isSmokeTest = process.argv.some(arg => arg.indexOf('--smoke-test') > -1);
	if (isSmokeTest) {
		compiler.hooks.failed.tap('smokeTest', async () => {
			await tsMessagesPromise;
			process.exit(1);
		});
		compiler.hooks.done.tap('smokeTest', async stats => {
			await tsMessagesPromise;
			if (stats.hasErrors() || stats.hasWarnings()) {
				process.exit(1);
			} else {
				process.exit(0);
			}
		});
	}

	return compiler;
}

module.exports = createCompiler
