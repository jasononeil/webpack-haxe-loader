const merge = require ('webpack-merge');
const baseConfig = require('./base.config');

module.exports = merge(baseConfig, {
    entry: './test2.hxml',
    output: {
        filename: 'bundle2.js'
    },
});
