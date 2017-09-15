# Release Notes

## Next

- **HAXELIB** Updated haxelib release (0.2.1)
	- Hotfix for relative paths on Windows. See https://github.com/jasononeil/webpack-haxe-loader/pull/8
- **HAXELIB** Updated haxelib release (0.2.0)
	- Rename `Webpack.async()` to `Webpack.load()`

## 0.4.0

- **NEW** React HMR (Hot Module Replacement) support.  This allows you to deep refresh the provided React component when a module is reloaded.

    Usage:

    ```haxe
    var rootComponent = ReactDOM.render(...);
    #if debug
    ReactHMR.autoRefresh(rootComponent);
    #end
    ```

- **HAXELIB** Updated haxelib release (0.1.0)

## 0.3.3

- **IMPROVED** Now auto-detecting the Main class and some other codegen optimisations  (sharing of requires)
- **IMPROVED** Pointing to released Haxe Modular

## 0.3.2

- **IMPROVED** Haxe modular has been refactored and now requires the main class as 1st module

## 0.3.1

- **FIXED** Add `loader-utils` as a dependency.

## 0.3.0

- **BREAKING:** Rename `Webpack.load()` to `Webpack.bundle()` so the API is less ambiguous when using 'import Webpack.*'
- **NEW**: Adding code splitting capability
- **NEW**: Add `Webpack.require()` macro for requiring files relative to the hx file.
- **NEW**: Loader options: add 'extra' with extra haxe compiler options.
- **FIXED**: Fix error where "watch" stopped watching after a Haxe error.
- **IMPROVED**: Removed tink_macro dependency
