import haxe.unit.TestRunner;
import haxe.unit.TestCase;
using StringTools;

class HaxeTests {
    static function main() {
        var suite = new TestRunner();
        suite.add(new WebpackTestCase());
        suite.run();
    }
}

class WebpackTestCase extends TestCase {

    function test_createImport() {
        assert(createImport('module', 'query') == 'import(/* webpackChunkName: "module" */ "query")');
    }

    function test_resolveModule() {
        assert(resolveModule('module') == '!haxe-loader?test/module!');
    }

    function test_rebaseRelativePath() {
        assert(rebaseRelativePath('src', './res') == 'src/res');
        assert(rebaseRelativePath('src/a', './res') == 'src/a/res');
        assert(rebaseRelativePath('src/a/b', './res') == 'src/a/b/res');
        assert(rebaseRelativePath('src/a/b', '../res') == 'src/a/res');
        assert(rebaseRelativePath('src/a/b', '../../res') == 'src/res');
        assert(rebaseRelativePath('src/a/b', '../../../res') == './res');
        assert(rebaseRelativePath('src', './c/res') == 'src/c/res');
        assert(rebaseRelativePath('src', '../res') == './res');
        assert(rebaseRelativePath('src', '../../res') == '../res');
        assert(rebaseRelativePath('src', '../../../res') == '../../res');
    }

    function test_relativePath() {
        assert(relativePath('src/a.hx') == './src/a.hx');
        assert(relativePath('/temp/src/a.hx') == '/temp/src/a.hx');
        assert(relativePath('C:\\temp\\src\\a.hx') == 'C:/temp/src/a.hx');
        assert(relativePath_madeAbsolute('src/a.hx') == './src/a.hx');
    }

    // macro functions wrappers

    macro static function createImport(module:String, query:String) {
        return macro $v{Webpack.createImport(module, query)};
    }

    @:access(Webpack.resolveModule)
    macro static function resolveModule(module:String) {
        return macro $v{Webpack.resolveModule(module)};
    }

    @:access(Webpack.rebaseRelativePath)
    macro static function rebaseRelativePath(directory:String, file:String) {
        return macro $v{Webpack.rebaseRelativePath(directory, file)};
    }

	@:access(Webpack.relativePath)
    macro static function relativePath(file:String) {
        return macro $v{Webpack.relativePath(file)};
    }

	@:access(Webpack.relativePath)
    macro static function relativePath_madeAbsolute(frag:String) {
        var file = Sys.getCwd() + frag;
        return macro $v{Webpack.relativePath(file)};
    }

    // custom assert macro

    macro static function assert(e:haxe.macro.Expr) {
        var s = haxe.macro.ExprTools.toString(e);
        return macro @:pos(e.pos) (function(?c:haxe.PosInfos) {
            currentTest.done = true;
            if (!$e) {
                currentTest.success = false;
                currentTest.error = 'assertion failed\n>>>  ' + $v{s};
                currentTest.posInfos = c;
                throw currentTest;
            }
        })();
    }
}
