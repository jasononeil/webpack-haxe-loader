const merge = require ('webpack-merge');
const baseConfig = require('./base.config');

module.exports = merge(baseConfig, {
    entry: './test1.hxml',
    output: {
        filename: 'bundle1.js'
    },
});
