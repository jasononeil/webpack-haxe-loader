#if macro
import haxe.macro.Expr;
import haxe.macro.ExprTools;
import haxe.macro.Context;
using haxe.io.Path;
using StringTools;
#end

class Webpack {
	/**
	 * JavaScript `require` function, for synchronous module loading
	 */
	public static macro function require(file:String):ExprOf<Dynamic> {
		if (Context.defined('js')) {
			// extract inline loaders
			var loaders = '';
			var bang = file.lastIndexOf('!');
			if (bang > 0) {
				loaders = file.substr(0, bang + 1);
				file = file.substr(bang + 1);
			}
			// Adjust relative path
			if (file.startsWith('.')) {
				var posInfos = Context.getPosInfos(Context.currentPos());
				file = rebaseRelativePath(posInfos.file.directory(), file);
			}
			return macro js.Lib.require($v{loaders + file});
		} else {
			// TODO: find a way to track "required" files on non-JS builds.
			// Perhaps by tracking in metadata and saving to the JSON outputFile, and processng inside the loader.
			return macro null;
		}
	}

	/**
	 * Load a Haxe class asynchronously, using haxe-modular code splitting to separate it from the main bundle.
	 *
	 * This will use `import()` to have webpack load it asynchronously.
	 *
	 * @param classRef The Haxe class or type you wish to load asynchronously
	 * @return A `js.Promise` that will complete when the module is loaded. See README for information on how to use.
	 */
	public static macro function load(classRef:Expr) {
		var ct = try Context.typeof(classRef) catch (err:Dynamic) {
			Context.fatalError('Unable to resolve ' + ExprTools.toString(classRef), Context.currentPos());
		}
		switch (ct) {
			case haxe.macro.Type.TType(_.get() => t, _):
				var module = t.module.split('_').join('_$').split('.').join('_');
				return createLoader(module);
			default:
		}
		Context.fatalError('A module class reference is required', Context.currentPos());
		return macro {};
	}

	/**
	 * Load a manually controlled bundle using it's bundle identifier.
	 *
	 * With haxe-modular it is possible to manually control which modules are split into separate bundles.
	 * This is useful if your project makes heavy use of reflection, which will limit the effectiveness of
	 * automatic code-splitting. See https://github.com/elsassph/haxe-modular/blob/master/doc/advanced.md#controlled-bundling
	 *
	 * @param name The unique name of the manually configured haxe-modular bundle you wish to load. Must be a constant string.
	 * @return A `js.Promise` that will resolve with the loaded module. See the link above for details on usage.
	 */
	public static macro function loadModule(name:Expr) {
		switch (name.expr) {
			case EConst(CString(module)):
				var query = resolveModule(module);
				var dynamicImport = createImport(module, query);
				return macro untyped __js__($v{dynamicImport});
			default:
		}
		Context.fatalError('A String literal is required', Context.currentPos());
		return macro {};
	}

	#if macro
	static public function createLoader(module:String) {
		var query = resolveModule(module);
		var dynamicImport = createImport(module, query);
		var link = macro untyped $i{module} = $p{["$s", module]};
		return macro {
			#if debug
			if (untyped module.hot) {
				untyped module.hot.accept($v{query}, function() {
					#if react_hot
					untyped require($v{query});
					$link;
					#else
					js.Browser.document.location.reload();
					#end
				});
			}
			#end
			untyped __js__($v{dynamicImport})
				.then(function(exports) {
					$link;
					var _ = untyped $i{module}; // forced reference
					return exports;
				});
		}
	}

	static public function createImport(module:String, query:String) {
		#if webpack_nonamedchunks
		return 'import("$query")';
		#else
		return 'import(/* webpackChunkName: "$module" */ "$query")';
		#end
	}

	static function resolveModule(name:String) {
		var ns = Context.definedValue('webpack_namespace');
		return '!haxe-loader?$ns/$name!';
	}

	static function rebaseRelativePath(directory:String, file:String) {
		directory = makeRelativeToCwd(directory);
		directory = '${directory}/${file}'.normalize();
		if (directory.isAbsolute() || directory.startsWith('../')) return directory;
		return './$directory';
	}

	static function makeRelativeToCwd(directory:String) {
		directory = directory.removeTrailingSlashes();
		var len = directory.length;

		if (directory.isAbsolute()) {
			var cwd = Sys.getCwd().replace('\\', '/');
			directory = directory.replace('\\', '/');
			if (directory.startsWith(cwd)) return './${directory.substr(cwd.length)}';
			return directory;
		}

		if (directory.startsWith('./') || directory.startsWith('../'))
			return directory;

		return './$directory';
	}
	#end
}

