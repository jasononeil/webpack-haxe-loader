#if macro
import haxe.macro.Expr;
import haxe.macro.Context;
using haxe.io.Path;
using StringTools;
#end

class Webpack {
	/**
	 * JavaScript 'require' function, for synchronous module loading
	 */
	public static macro function require(file:String):ExprOf<Dynamic> {
		if (Context.defined('js')) {
			// Adjust relative path
			// TODO: handle inline loader syntax
			if (file.startsWith('.')) {
				var posInfos = Context.getPosInfos(Context.currentPos());
				var directory = posInfos.file.directory();
				file = rebaseRelativePath(directory, file);
			}
			return macro js.Lib.require($v{file});
		} else {
			// TODO: find a way to track "required" files on non-JS builds.
			// Perhaps by tracking in metadata and saving to the JSON outputFile, and processng inside the loader.
			return macro null;
		}
	}

	/**
	 * JavaScript 'import' function, for asynchronous module loading
	 */
	public static macro function async(classRef:Expr) {
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

	#if macro
	static function rebaseRelativePath(directory:String, file:String) {
		if (file.startsWith('./')) {
			file = file.substr(2);
			return './${directory}/${file}';
		}

		while (file.startsWith('../')) {
			if (directory.indexOf('/') > 0) {
				file = file.substr(3);
				directory = directory.directory();
			} else if (directory != '') {
				file = file.substr(3);
				directory = '';
				break;
			}
		}

		if (directory != '') {
			return './${directory}/${file}';
		}
		if (file.startsWith('.')) {
			// file goes further up the project root
			return file;
		}
		return './${file}';
	}
	#end
}
