#if macro
import haxe.macro.Expr;
import haxe.macro.Context;
using tink.MacroApi;
using haxe.io.Path;
#end

class Webpack {
	/**
	 * JavaScript 'require' function, for synchronous module loading
	 */
	public static macro function require(fileExpr:ExprOf<String>) {
		if (Context.defined('js')) {
			// If the file path begins with "./"
			var file = fileExpr.getString().sure();
			if (StringTools.startsWith(file, "./")) {
				var posInfos = Context.getPosInfos(fileExpr.pos);
				var directory = posInfos.file.directory();
				file = './${directory}/${file.substr(2)}';
			}
			return macro (js.Lib.require($v{file}):Any);
		} else {
			// TODO: find a way to track "required" files on non-JS builds.
			// Perhaps by tracking in metadata and saving to the JSON outputFile, and processng inside the loader.
			return macro (null:Any);
		}
	}

	/**
	 * JavaScript 'import' function, for asynchronous module loading
	 */
	public static macro function load(classRef:Expr) {
		switch (Context.typeof(classRef)) {
			case haxe.macro.Type.TType(_.get() => t, _):
				var module = t.module.split('.').join('_');
				var ns = Context.definedValue('webpack_namespace');
				var query = '!haxe-loader?$ns/$module!';
				return macro {
					untyped __js__('System.import')($v{query})
						.then(function(exports) {
							untyped $i{module} = $p{["$s", module]};
							return exports;
						});
				}
			default:
		}
		Context.fatalError('A module class reference is required', Context.currentPos());
		return macro {};
	}

	/**
	 * JavaScript 'module.exports' helper
	 */
	public static macro function export(expr:Expr) {
		return macro untyped module.exports = $expr;
	}
}
