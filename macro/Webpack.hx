#if macro
import haxe.macro.Expr;
import haxe.macro.Context;
using tink.MacroApi;
using haxe.io.Path;
#end

class Webpack {
	public static macro function require(fileExpr:ExprOf<String>):Expr {
		#if macro
		if (Context.defined('js')) {
			// If the file path begins with "./"
			var file = fileExpr.getString().sure();
			if (StringTools.startsWith(file, "./")) {
				var posInfos = Context.getPosInfos(fileExpr.pos);
				var directory = posInfos.file.directory();
				file = './${directory}/${file.substr(2)}';
			}
			return macro js.Lib.require($v{file});
		} else {
			// TODO: find a way to track "required" files on non-JS builds.
			// Perhaps by tracking in metadata and saving to the JSON outputFile, and processng inside the loader.
			return macro null;
		}
		#end
	}
}
