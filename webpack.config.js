/*
Relevant links:
- Output ES modules: https://webpack.js.org/configuration/output/#type-module
- Target node and browser: https://webpack.js.org/configuration/target/
- Multiple configurations: https://webpack.js.org/configuration/configuration-types/#exporting-multiple-configurations
*/
export default [
  {
    mode: 'production',
    target: 'web',
    entry: './src/index.js',
    experiments: { outputModule: true },
    output: {
      filename: '[name].browser.mjs',
      library: {
        type: 'module'
      }
    },
    devtool: 'source-map'
  },
  {
    mode: 'production',
    target: 'node',
    entry: './src/index.js',
    experiments: { outputModule: true },
    output: {
      filename: '[name].node.mjs',
      library: {
        type: 'module'
      }
    },
    devtool: 'source-map'
  }
];
