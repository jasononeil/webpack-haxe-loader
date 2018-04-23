
module.exports = Object.assign({}, require('./base.config'), {
    entry: './test1.hxml',
    output: {
        path: `${__dirname}/out/`,
        filename: 'bundle1.js'
    },
});
