import * as webpack from 'webpack';
import { isProd, merge } from './utils';
import { base } from './base';
import { packageRoot, runtimeRoot } from '../../utils/path';

const HTMLPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

export let modernClient: webpack.Configuration = merge(base, {
  entry: {
    app: runtimeRoot('src/client/index'),
  },
  output: {
    path: runtimeRoot('dist/client'),
    filename: '[name].[chunkHash].js',
    publicPath: '/client/',
    chunkFilename: '[name].[id].[chunkhash].js',
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
      },
    },
    runtimeChunk: 'single',
  },
  plugins: [
    new webpack.DefinePlugin({ CLIENT: true, SERVER: false }),
    new HTMLPlugin({ template: runtimeRoot('src/index.template.html'), spa: false }),
    new ScriptExtHtmlWebpackPlugin({ module: '/\.js$/' }),
  ],
}) as any;

// remove ts loader as we need to add again with different configuration
modernClient.module.rules.shift();

// add ts loader to the beginning of loaders list
modernClient.module.rules.unshift({
  test: /\.ts$/,
  loader: 'ts-loader',
  include: [runtimeRoot('src'), packageRoot('src/webpack/dev')],
  exclude: /node_modules/,
  options: {
    appendTsSuffixTo: [/\.vue$/],
    transpileOnly: true,
    configFile: runtimeRoot('tsclient.config.json'),
  },
});

if (isProd) {
  modernClient.plugins = (modernClient.plugins || []).concat([
    new ServiceWorkerWebpackPlugin({ entry: runtimeRoot('src/client/sw.ts') }),
    new CompressionPlugin({ algorithm: 'gzip', test: /\.js$|\.css$|\.html$/, threshold: 0, minRatio: 1 }),
  ]);
}

modernClient = require(runtimeRoot('.vuesion/webpack.config'))(modernClient, 'client');

export default modernClient;
