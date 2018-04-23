const path = require('path');
const dist = `${__dirname}/www/`;

module.exports = {
    devtool: 'cheap-module-eval-source-map',
    entry: path.resolve(__dirname, 'test1.hxml'),
    output: {
        path: dist,
        filename: 'bundle1.js'
    },
    module: {
        rules: [
            {
                test: /\.hxml$/,
                loader: path.resolve(__dirname, '../'),
                options: {
                    debug: true
                }
            }
        ]
    }
};
