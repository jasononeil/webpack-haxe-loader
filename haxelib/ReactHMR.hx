typedef ModuleHMR = {
	data: Dynamic,
	status: (String->Void)->Void,
	accept: ?Dynamic->Void,
	dispose: (Dynamic->Void)->Void
}

class ReactHMR {
	/**
	 * Deep refresh the provided React component when a module is reloaded.
	 * This function should be only called once.
	 *
	 * Usage:
	 *
	 *	 var rootComponent = ReactDOM.render(...);
	 *	 #if debug
	 *	 ReactHMR.autoRefresh(rootComponent);
	 *	 #end
	 */
	static public function autoRefresh(component:Dynamic, autoReloadMain:Bool = true) {
		var hot:ModuleHMR = untyped module.hot;
		if (hot != null) {
			// allow main module to be updated
			hot.accept();
			if (autoReloadMain) {
				// BUT if main module has changed, reload the page
				hot.dispose(function (data) {
					js.Browser.document.location.reload();
				});
			}
			// if a module has changed, force deep React re-render
			var dirty = false;
			hot.status(function(status) {
				if (status == 'apply') dirty = true;
				else if (status == 'idle' && dirty) {
					dirty = false;
					if (component._reactInternalInstance) {
						HMRClient.refresh(component);
					}
				}
			});
		}
	}
}

/**
 * React HMR client code:
 * - registers and proxies React component classes,
 * - when `refresh` is called, runs a deep force-update of the given component.
 */
@:jsRequire('haxe-modular')
extern class HMRClient {
	static public function refresh(component:Dynamic):Void;
}
