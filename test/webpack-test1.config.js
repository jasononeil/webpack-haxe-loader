const merge = require('webpack-merge');
const baseConfig = require('./base.config');

module.exports = merge(baseConfig, {
    mode: 'development',
    devtool: 'source-map',
    entry: './test1.hxml',
    output: {
        filename: 'bundle1.js'
    }
});
