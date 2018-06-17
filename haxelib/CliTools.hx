import haxe.macro.Context;
import sys.FileSystem;

class CliTools {
    static function getClasspath():Void {
		var cp = Context.getClassPath();

        for (c in cp) {
            if (c == '') continue;
            c = FileSystem.absolutePath(c);
            Sys.println('path: $c');
        }

        // Abort compilation
        Sys.exit(0);
    }
}
