class Test1 {
    static function main() {
        trace('Test1');
        var json = Webpack.require('./test.json');
        Webpack.require('null-loader!../util.js');
    }
}
