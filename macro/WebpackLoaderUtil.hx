import haxe.macro.Context;
import haxe.macro.Type;
import haxe.macro.Expr;
import sys.io.File;

class WebpackLoaderUtil {
	public static function outputJson(outputFile:String) {
		Context.onGenerate(function (types:Array<Type>) {
			var allFilesUsed = [];
			for (type in types) {
				addFilesForType(type, allFilesUsed);
			}
			var data = {
				modules: allFilesUsed
			};
			var json = haxe.Json.stringify(data);
			File.saveContent(outputFile, json);
		});
	}

	static function addFilesForType(type:Type, files:Array<String>) {
		switch type {
			case TMono(_.get() => t):
				addFilesForType(t, files);
			case TEnum(_.get() => et, params):
				addFileFromPosition(et.pos, files);
			case TInst(_.get() => ct, params):
				addFileFromPosition(ct.pos, files);
			case TType(_.get() => td, params):
				addFileFromPosition(td.pos, files);
			case TFun(args, ret):
				// No files to add.
			case TAnonymous(_.get() => a):
				// No files to add.
			case TDynamic(dynamicParam):
				if (dynamicParam != null) {
					addFilesForType(dynamicParam, files);
				}
			case TLazy(fn):
				addFilesForType(fn(), files);
			case TAbstract(_.get() => a, params):
				addFileFromPosition(a.pos, files);
		}
	}

	static function addFileFromPosition(p:Position, files:Array<String>) {
		var info = Context.getPosInfos(p);
		if (files.indexOf(info.file) < 0) {
			files.push(info.file);
		}
	}
}
