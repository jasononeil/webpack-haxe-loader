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

    function test_relativePath() {
        assert(makeRelativeToCwd('src') == './src');
        assert(makeRelativeToCwd('src/') == './src');
        assert(makeRelativeToCwd('src/a.hx') == './src/a.hx');
        assert(makeRelativeToCwd('/temp/src/a.hx') == '/temp/src/a.hx');
        assert(makeRelativeToCwd('C:\\temp\\src\\a.hx') == 'C:/temp/src/a.hx');
        assert(makeRelativeToCwd_madeAbsolute('src/a.hx') == './src/a.hx');
    }

    function test_rebaseRelativePath() {
        assert(rebaseRelativePath('./src', './res') == './src/res');
        assert(rebaseRelativePath('./src/', './res') == './src/res');
        assert(rebaseRelativePath('./src/a', './res') == './src/a/res');
        assert(rebaseRelativePath('./src/a/b', './res') == './src/a/b/res');
        assert(rebaseRelativePath('./src/a/b', '../res') == './src/a/res');
        assert(rebaseRelativePath('./src/a/b', '../../res') == './src/res');
        assert(rebaseRelativePath('./src/a/b', '../../../res') == './res');
        assert(rebaseRelativePath('./src', './c/res') == './src/c/res');
        assert(rebaseRelativePath('./src', '../res') == './res');
        assert(rebaseRelativePath('./src', '../../res') == '../res');
        assert(rebaseRelativePath('./src', '../../../res') == '../../res');
        assert(rebaseRelativePath('src', '../../../res') == '../../res');
        assert(rebaseRelativePath('/temp/src/a', '../../../res') == '/res');
        assert(rebaseRelativePath('C:/temp/src/', '../../res') == 'C:/res');
        assert(rebaseRelativePath('C:/src/', './res') == 'C:/src/res');
        assert(rebaseRelativePath('C:/src/', '../res') == 'C:/res');
        assert(rebaseRelativePath('C:/', './res') == 'C:/res');
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

	@:access(Webpack.makeRelativeToCwd)
    macro static function makeRelativeToCwd(file:String) {
        return macro $v{Webpack.makeRelativeToCwd(file)};
    }

	@:access(Webpack.makeRelativeToCwd)
    macro static function makeRelativeToCwd_madeAbsolute(frag:String) {
        var file = Sys.getCwd() + frag;
        return macro $v{Webpack.makeRelativeToCwd(file)};
    }

    // custom assert macro

    macro static function assert(e:haxe.macro.Expr) {
        var s = haxe.macro.ExprTools.toString(e);
        var errMsg = switch (e.expr) {
            case EBinop(OpEq, e1, e2):
                macro 'assertion failed\n'
                    + '>>>  ' + $v{s} + '\n'
                    + '>>>  ' + ${e1} + ' != ' + ${e2};

            default:
                macro 'assertion failed\n>>>  ' + $v{s};
        };

        return macro @:pos(e.pos) (function(?c:haxe.PosInfos) {
            currentTest.done = true;
            if (!$e) {
                currentTest.success = false;
                currentTest.error = ${errMsg};
                currentTest.posInfos = c;
                throw currentTest;
            }
        })();
    }
}
