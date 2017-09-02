class ReactHMR
{
	/**
	 * Deep refresh the provided React component when a module is reloaded.
     * This function should be only called once.
     *
     * Usage:
     * 
     *     var rootComponent = ReactDOM.render(...);
     *     #if debug 
     *     ReactHMR.autoRefresh(rootComponent);
     *     #end
	 */
	static public function autoRefresh(component:Dynamic) 
	{
        if (untyped module.hot) {
            var dirty = false;
            untyped module.hot.status(function(status) {
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
