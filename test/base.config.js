const path = require('path');

module.exports = {
    target: 'node',
    devtool: 'cheap-module-eval-source-map',
    output: {
        path: `${__dirname}/out/`
    },
    resolveLoader: {
        alias: {
            'haxe-loader': path.join(__dirname, '../')
        }
    },
    module: {
        rules: [
            {
                test: /\.hxml$/,
                loader: 'haxe-loader',
                options: {
                    debug: true
                }
            }
        ]
    }
};
