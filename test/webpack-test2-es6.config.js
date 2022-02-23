const merge = require('webpack-merge');
const baseConfig = require('./base.config');

module.exports = merge(baseConfig, {
    mode: 'development',
    devtool: 'source-map',
    entry: './test2-es6.hxml',
    output: {
        filename: 'bundle2-es6.js'
    }
});
