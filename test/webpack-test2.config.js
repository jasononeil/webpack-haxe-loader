
module.exports = Object.assign({}, require('./base.config'), {
    entry: './test2.hxml',
    output: {
        path: `${__dirname}/out/`,
        filename: 'bundle2.js'
    },
});
