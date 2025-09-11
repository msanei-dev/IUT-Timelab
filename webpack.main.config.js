const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

const mainConfig = {
  entry: './src/index.ts',
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
};

module.exports = { mainConfig };
