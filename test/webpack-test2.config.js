
module.exports = Object.assign({}, require('./base.config'), {
    entry: './test2.hxml',
    output: {
        path: `${__dirname}/www/`,
        filename: 'bundle2.js'
    },
});
