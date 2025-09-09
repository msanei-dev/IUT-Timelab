const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: 'public/data.json',
        to: 'data.json',
      },
      {
        from: 'public/Estedad-Variable.woff2',
        to: 'fonts/Estedad-Variable.woff2',
      },
    ],
  }),
];
