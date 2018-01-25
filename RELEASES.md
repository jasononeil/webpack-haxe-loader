# Release Notes

## Next

## 0.7.1

- 🐛: Upgrade to Haxe Modular 0.9.3 as the 0.9.2 release was buggy.

## 0.7.0

- ✨: Add `Webpack.loadModule()` to be used in combination with haxe-modular manual code splitting. See https://github.com/elsassph/haxe-modular/blob/master/doc/advanced.md#controlled-bundling
- ✅: Upgraded to haxe-modular 0.9.2 for the change above, as well as improved build times.

## 0.6.0

- 💔: Revert change from 0.5.0. Now, as was the case in 0.4.1, NodeJS files will
  also be compiled by webpack. If you would like to avoid compiling NodeJS files,
  you can use `-D prevent-webpack-js-output` in your hxml file.
- 🐛: Upgraded to Haxe Modular 0.8.0 to fix issue with nested async requires.
  See https://github.com/jasononeil/webpack-haxe-loader/issues/16

## 0.5.0

- ✨: Treat NodeJS builds the same as non-JS builds - watch and recompile, but don't process with webpack.

## 0.4.1

- ✅: Update to haxe-module 0.6.0, which fixed the error "Expecting single root statement in program". See https://github.com/jasononeil/webpack-haxe-loader/issues/7
- ✅: Updated haxelib release (0.2.1)
	- Hotfix for relative paths on Windows. See https://github.com/jasononeil/webpack-haxe-loader/pull/8
- ✅: Updated haxelib release (0.2.0)
	- Rename `Webpack.async()` to `Webpack.load()`

## 0.4.0

- ✨ React HMR (Hot Module Replacement) support.  This allows you to deep refresh the provided React component when a module is reloaded.

    Usage:

    ```haxe
    var rootComponent = ReactDOM.render(...);
    #if debug
    ReactHMR.autoRefresh(rootComponent);
    #end
    ```

- ✅: Updated haxelib release (0.1.0)

## 0.3.3

- ✅: Now auto-detecting the Main class and some other codegen optimisations  (sharing of requires)
- ✅: Pointing to released Haxe Modular

## 0.3.2

- ✅: Haxe modular has been refactored and now requires the main class as 1st module

## 0.3.1

- 🐛: Add `loader-utils` as a dependency.

## 0.3.0

- 💔: Rename `Webpack.load()` to `Webpack.bundle()` so the API is less ambiguous when using 'import Webpack.*'
- ✨: Adding code splitting capability
- ✨: Add `Webpack.require()` macro for requiring files relative to the hx file.
- ✨: Loader options: add 'extra' with extra haxe compiler options.
- 🐛: Fix error where "watch" stopped watching after a Haxe error.
- ✅: Removed tink_macro dependency

### Legend

- 💔: Breaking change
- ✨: New feature
- 🐛: Bugfix
