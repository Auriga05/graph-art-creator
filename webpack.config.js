const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

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
    filename: './dist/index-experimental.user.js',
    path: __dirname,
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: fs.readFileSync('./other/header.txt').toString('ascii'),
      raw: true
    })
  ],
  watch: true
};