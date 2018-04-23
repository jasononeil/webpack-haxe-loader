const path = require('path');

module.exports = {
    devtool: 'cheap-module-eval-source-map',
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
