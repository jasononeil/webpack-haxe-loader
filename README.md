# Haxe Loader for Webpack

[![npm Version](https://img.shields.io/npm/v/haxe-loader.svg)](https://www.npmjs.com/package/haxe-loader)
[![Downloads](http://img.shields.io/npm/dm/haxe-loader.svg)](https://npmjs.org/package/haxe-loader)
[![Join the chat at https://gitter.im/haxe-react/haxe-modular](https://img.shields.io/badge/gitter-join%20chat-brightgreen.svg)](https://gitter.im/haxe-react/haxe-modular)

This is the [Haxe](https://haxe.org) loader for Webpack.

If you're unsure why you should be using Webpack, read
[an introduction to Webpack for Haxe developers](webpack-tips.md).

## Getting Started

### Examples

There is a small example Haxe+Webpack project presenting
[vanilla DOM](https://github.com/elsassph/webpack-haxe-example)
and [React](https://github.com/elsassph/webpack-haxe-example/tree/react) approaches.
These examples gives you a sample functional Webpack config, a couple of classes and leverage
Webpack features like:

- loading images, styles and configuration,
- code splitting,
- and hot-module replacement (with React).

### Installation

Instructions assume basic knowledge of Webpack; it is advised to first follow
the [Getting started](https://webpack.js.org/guides/getting-started/) guide.

    yarn add --dev haxe-loader

or

    npm install --save-dev haxe-loader

### Compatibility

Haxe Loader is compatible with Webpack 3 and 4, and Haxe 3.4+.
If you notice a compatibility problem, please log an issue.

You must have Haxe compiler installed: https://haxe.org/download

### Configuration

1. Create or update `webpack.config.js` like so:

```js
module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: './app.hxml',
  output: {
    filename: 'bundle.js'
  },
  module: {
    rules: [
      // all files with hxml extension will be handled by `haxe-loader`
      {
        test: /\.hxml$/,
        loader: 'haxe-loader',
        options: {
          debug: true
        }
      }
    ]
  }
}
```

You'll note that the input is `./app.hxml`, not Haxe code files: this loader will
run the Haxe compiler with the HXML parameters, and include the resulting JavaScript
into the bundle.

HXML files can be the bundle entry point, as in this example, or can be "required"
from JavaScript:

```js
// in `myscript.js`:
const haxeApp = require('./app.hxml');
// haxeApp holds the @:exposed classes/methods of your Haxe JS
// e.g.: new haxeApp.MyExposedHaxeClass()
```

2. Create an HXML file for your project

HXML files are a way to specify Haxe compiler arguments; for this loader, configure
the compiler as for any Haxe-JavaScript project, and add `-lib haxe-loader`:

```
-cp src
-main Main
-lib haxe-loader
-js out.js
```

Notes:

- the name/path of the JS output doesn't matter, but it has to be present,
- HXML files (at the moment) have to reside at the root of the project,
- you can NOT use `--next` to specify multiple builds in one HXML,
- you can still use this HXML using the Haxe compiler directly for troubleshooting.


## Webpack require and code splitting

### Webpack require

To require 3rd party NPM modules, you can use `@:jsRequire` metadata or
[`js.Lib.require()`](http://api.haxe.org/js/Lib.html#require).

However, those requires are relative to you HXML file!
It also cannot be compiled on platforms other than JS.

For assets/styles, it is therefore recommended to instead call:

```haxe
Webpack.require('./MyFile.css');    // requires a CSS file in the same directory as the current ".hx" file
Webpack.require('../locales.json'); // requires a JSON file in the parent directory of the current ".hx" file
```

It is silently ignored on non-JS targets.
In future we may try to handle require statements for other targets.

### Code splitting (load on demand)

To leverage code splitting, you must use the `Webpack.load` asynchronous
require, and provide the Haxe module you want to load as a separate bundle:

```haxe
import com.MyComponent;
...
Webpack.load(MyComponent).then(function(_){
    var comp = new MyComponent();
});
```

Using this API, the Haxe compiler output will be processed and cut into separate files,
and Webpack will emit separate bundles with these files and their required dependencies.

- To learn more about the splitting process, see [haxe-modular](https://github.com/elsassph/haxe-modular).
- An advanced API to control Haxe code splitting is available - see:
[controlled splitting API](https://github.com/elsassph/haxe-modular/blob/master/doc/advanced.md#controlled-bundling).

### Named bundles

Split bundles used to be named `0.js`, `1.js`... Haxe loader now defaults to naming the bundles
according to the module name (e.g. `com_Foo.js`).

To revert to the original naming behaviour, you can add `-D webpack_nonamedchunks`.


## DevTools / source maps

If you want to be able to debug your original source then you can thanks to the magic
of sourcemaps. There are 2 steps to getting this set up with haxe-loader and webpack.

First, for haxe-loader to produce sourcemaps, you have to do a debug Haxe build,
for that you need to set the `debug` flag in the loader options:

```js
{
  test: /\.hxml$/,
  loader: 'haxe-loader',
  options: {
    debug: true
  }
}
```

Second, you need to set the devtool option in your `webpack.config.js` to support the
type of sourcemaps you want. To make your choice have a read of the
[Webpack development guide](https://webpack.js.org/guides/development/).

You may be somewhat overwhelmed by the choice available, so here are some example
strategies for different environments:

- `devtool: 'cheap-module-eval-source-map'` - Best support for sourcemaps whilst debugging
- `devtool: 'source-map'` - Suitable for use in Production


## Loader options

The Haxe Loader supports a number of options:

- `debug`: *(Boolean)* Haxe debug compilation (emits sourcemaps), and is suitable for hot-module replacement
- `sizeReport`: *(Boolean)* Generate size report (see below)
- `extra`: *(String)* Additional Haxe compiler arguments, applied after the HXML file
- `delayForNonJsBuilds`: See [advanced usage tip with non-JS targets](webpack-tips.md)
- `logCommand`: *(Boolean)* Logs final Haxe compiler arguments (via `console.log`)
- `ignoreWarnings`: *(Boolean)* Do not forward Haxe warnings to webpack
- `emitStdoutAsWarning`: *(Boolean)* Generate a webpack warning with Haxe's stdout


## Detailed size reporting

Webpack has a number of [size analyser tools](https://survivejs.com/webpack/optimizing/build-analysis/),
but they won't show much details about your Haxe code size.

Haxe Loader includes its own size reporting / visualiser tool to generate a size report as an
extra `<output>.stats.json`, and an interactive visualisation of this report, as an extra `<output>.stats.html`.

Notes:
- enable size reporting by adding the `sizeReport` flag in the loader options,
- `<output>` is picked from the output specified in the HXML file.

Viewer usage: click a group to reveal more details, press Escape or click the Back button to navigate back.

![Stats viewer](https://raw.githubusercontent.com/elsassph/haxe-modular/master/doc/stats.png)

## Contributing

Don't hesitate to create a pull request. Every contribution is appreciated.

If you encounter a bug, please open a Github issue. As webpack configuration can differ greatly between projects, it is helpful if you can reproduce the bug using our [example repository](https://github.com/elsassph/webpack-haxe-example) as a starting point.

If you would like to discuss anything with us, we can be contacted on the [haxe-modular Gitter channel](https://gitter.im/haxe-react/haxe-modular).

### Maintainers

<table>
  <tbody>
    <tr>
      <td align="center">
        <a href="https://github.com/jasononeil">
          <img width="150" height="150" src="https://github.com/jasononeil.png?v=3&s=150">
          </br>
          Jason O'Neil
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/elsassph">
          <img width="150" height="150" src="https://github.com/elsassph.png?v=3&s=150">
          </br>
          Philippe Elsass
        </a>
      </td>
    </tr>
  <tbody>
</table>

### License

MIT
