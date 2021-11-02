const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.user.ts',
  // devtool: 'inline-source-map',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'index-experimental.user.js',
    path: __dirname,
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: `// ==UserScript==
// @name         Graph Art Creator - Experimental
// @namespace    http://tampermonkey.net/
// @version      1.0a
// @description  precal thing
// @author       Auriga05
// @match        https://www.desmos.com/calculator*
// @icon         https://www.google.com/s2/favicons?domain=desmos.com
// @grant        unsafeWindow
// @updateURL    https://github.com/Auriga05/graph-art-creator/raw/master/index.user.js
// @downloadURL  https://github.com/Auriga05/graph-art-creator/raw/master/index.user.js
// @require      https://code.jquery.com/jquery-3.5.1.slim.min.js
// @require      https://cdn.jsdelivr.net/npm/evaluatex@2.2.0/dist/evaluatex.min.js
// ==/UserScript==`,
      raw: true
    })
  ],
  watch: true
};