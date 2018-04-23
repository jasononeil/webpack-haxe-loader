class Test2 {
    static function main() {
        trace('Test2');
        new Test2();
    }

    function new() {
        Webpack.load(Test2Sub).then(function(_) {
            new Test2Sub();
        });
    }
}
