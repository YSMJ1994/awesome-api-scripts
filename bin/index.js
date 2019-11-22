#!/usr/bin/env node

const [, , command, dotEnv, ...args] = process.argv;
process.env.DOT_ENV = dotEnv;

if (!command) {
	console.error('require command start,build,test!');
	process.exit(-1);
}

switch (command) {
	case 'start': {
		require('../scripts/start')();
		break;
	}
	case 'build': {
		require('../scripts/build')();
		break;
	}
	case 'build-doc': {
		require('../scripts/build-doc')();
		break;
	}
	case 'test': {
		require('../scripts/test')(args);
		break;
	}
	default: {
		console.error('unknown command ' + command);
		process.exit(-1);
	}
}
