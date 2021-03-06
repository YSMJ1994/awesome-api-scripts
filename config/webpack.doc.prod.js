const env = require('./env');
const webpack = require('webpack');
const resolve = require('resolve');
const isWsl = require('is-wsl');
const postcssNormalize = require('postcss-normalize');
const getCSSModuleLocalIdent = require('./getCSSModuleLocalIdent');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('./InterpolateHtmlPlugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const { docBuild, appSrc, docIndexJs, appHtml, moduleFileExtensions, resolveTarget } = require('./paths');
const publicPath = process.env.API_DOC_BASE_URL || '/'
const shouldUseRelativeAssetPaths = publicPath === './';
const getStyleLoaders = (cssOptions, preProcessor) => {
	const loaders = [
		{
			loader: MiniCssExtractPlugin.loader,
			options: Object.assign({}, shouldUseRelativeAssetPaths ? { publicPath: '../../' } : undefined)
		},
		{
			loader: require.resolve('css-loader'),
			options: cssOptions
		},
		{
			loader: require.resolve('postcss-loader'),
			options: {
				ident: 'postcss',
				plugins: () => [
					require('postcss-flexbugs-fixes'),
					require('postcss-preset-env')({
						autoprefixer: {
							flexbox: 'no-2009'
						},
						stage: 3
					}),
					postcssNormalize()
				],
				sourceMap: false
			}
		}
	].filter(Boolean);
	if (preProcessor) {
		loaders.push(
			{
				loader: require.resolve('resolve-url-loader'),
				options: {
					sourceMap: false
				}
			},
			{
				loader: require.resolve(preProcessor),
				options: {
					sourceMap: true
				}
			}
		);
	}
	return loaders;
};

const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const babelLoader = {
	loader: 'babel-loader',
	options: {
		customize: require.resolve('babel-preset-react-app/webpack-overrides'),

		plugins: [
			[
				require.resolve('babel-plugin-named-asset-import'),
				{
					loaderMap: {
						svg: {
							ReactComponent: '@svgr/webpack?-svgo,+titleProp,+ref![path]'
						}
					}
				}
			]
		],
		presets: ['react-app'],
		cacheDirectory: true,
		cacheCompression: true,
		compact: true
	}
};

module.exports = {
	mode: 'production',
	devtool: false,
	entry: docIndexJs,
	output: {
		path: docBuild,
		filename: 'static/js/[name].[contenthash:8].js',
		chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
		publicPath
	},
	optimization: {
		minimize: true,
		minimizer: [
			// This is only used in production mode
			new TerserPlugin({
				terserOptions: {
					parse: {
						ecma: 8
					},
					compress: {
						ecma: 5,
						warnings: false,
						comparisons: false,
						inline: 2
					},
					mangle: {
						safari10: true
					},
					output: {
						ecma: 5,
						comments: false,
						ascii_only: true
					}
				},
				parallel: !isWsl,
				// Enable file caching
				cache: true,
				sourceMap: false
			}),
			// This is only used in production mode
			new OptimizeCSSAssetsPlugin({
				cssProcessorOptions: {
					parser: safePostCssParser,
					map: false
				}
			})
		],
		splitChunks: {
			chunks: 'all',
			name: true
		},
		runtimeChunk: {
			name: entrypoint => `runtime-${entrypoint.name}`
		}
	},
	resolve: {
		extensions: moduleFileExtensions.map(ext => `.${ext}`),
		alias: {
			'@': appSrc
		}
	},
	module: {
		strictExportPresence: true,
		rules: [
			{ parser: { requireEnsure: false } },
			{
				oneOf: [
					{
						test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
						loader: require.resolve('url-loader'),
						options: {
							limit: 1000,
							name: 'static/media/[name].[hash:8].[ext]'
						}
					},
					{
						test: /\.(js|mjs|jsx)$/,
						include: [appSrc],
						use: [babelLoader]
					},
					{
						test: /\.(ts|tsx)$/,
						include: [appSrc],
						use: [
							babelLoader,
							{
								loader: 'ts-loader',
								options: {
									transpileOnly: true,
									compilerOptions: {
										target: 'esnext',
										module: 'esnext'
									}
								}
							}
						]
					},
					{
						test: cssRegex,
						exclude: cssModuleRegex,
						use: getStyleLoaders({
							importLoaders: 1,
							sourceMap: false
						}),
						// Don't consider CSS imports dead code even if the
						// containing package claims to have no side effects.
						// Remove this when webpack adds a warning or an error for this.
						// See https://github.com/webpack/webpack/issues/6571
						sideEffects: true
					},
					// Adds support for CSS Modules (https://github.com/css-modules/css-modules)
					// using the extension .module.css
					{
						test: cssModuleRegex,
						use: getStyleLoaders({
							importLoaders: 1,
							sourceMap: false,
							modules: true,
							getLocalIdent: getCSSModuleLocalIdent
						})
					},
					// Opt-in support for SASS (using .scss or .sass extensions).
					// By default we support SASS Modules with the
					// extensions .module.scss or .module.sass
					{
						test: sassRegex,
						exclude: sassModuleRegex,
						use: getStyleLoaders(
							{
								importLoaders: 2,
								sourceMap: false
							},
							'sass-loader'
						),
						// Don't consider CSS imports dead code even if the
						// containing package claims to have no side effects.
						// Remove this when webpack adds a warning or an error for this.
						// See https://github.com/webpack/webpack/issues/6571
						sideEffects: true
					},
					// Adds support for CSS Modules, but using SASS
					// using the extension .module.scss or .module.sass
					{
						test: sassModuleRegex,
						use: getStyleLoaders(
							{
								importLoaders: 2,
								sourceMap: false,
								modules: true,
								getLocalIdent: getCSSModuleLocalIdent
							},
							'sass-loader'
						)
					},
					{
						loader: require.resolve('file-loader'),
						exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
						options: {
							name: 'static/media/[name].[hash:8].[ext]'
						}
					}
				]
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			inject: true,
			template: appHtml,
			filename: 'index.html',
			minify: {
				removeComments: true,
				collapseWhitespace: true,
				removeRedundantAttributes: true,
				useShortDoctype: true,
				removeEmptyAttributes: true,
				removeStyleLinkTypeAttributes: true,
				keepClosingSlash: true,
				minifyJS: true,
				minifyCSS: true,
				minifyURLs: true
			}
		}),
		new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
		new webpack.DefinePlugin(env.stringified),
		new MiniCssExtractPlugin({
			// Options similar to the same options in webpackOptions.output
			// both options are optional
			filename: 'static/css/[name].[contenthash:8].css',
			chunkFilename: 'static/css/[name].[contenthash:8].chunk.css'
		}),
		new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
		new ForkTsCheckerWebpackPlugin({
			typescript: resolve.sync('typescript', {
				basedir: resolveTarget('node_modules')
			}),
			async: false,
			useTypescriptIncrementalApi: true,
			checkSyntacticErrors: true,
			resolveModuleNameModule: undefined,
			resolveTypeReferenceDirectiveModule: undefined,
			tsconfig: resolveTarget('tsconfig.json'),
			reportFiles: ['**', '!**/tests/**', '!**/?(*.)(spec|test).*', '!**/src/app/proxy.js.*'],
			watch: appSrc,
			silent: true,
			formatter: undefined
		})
	],
	node: {
		module: 'empty',
		dgram: 'empty',
		dns: 'mock',
		fs: 'empty',
		http2: 'empty',
		net: 'empty',
		tls: 'empty',
		child_process: 'empty'
	},
	performance: false
};
