# Haxe Loader for Webpack

This loader allows you to load hxml files directly into webpack, and included the Haxe-compiled Javascript result directly in your bundle.

There are several reasons for doing this:

- If you are going to use NPM libraries as externs, you need to compile with Webpack or Browserify etc. Having the two compile steps (Haxe and Webpack) makes it easier.
- There's a good chance you'll want webpack anyway for compiling CSS (or SASS or LESS), managing static assets, or minifying the resulting JS bundle.
- When Webpack is set up right, it has a nice development experience, with things like:
    - `webpack --watch` to watch any changes you make to a file and recompile.
    - `webpack-dev-server` to hot-reload a page based on changes you make.

With this loader, you are able to:

- Use a `hxml` file as the entry point for your build.
- Change any `*.hx` source file, and have haxe re-compile, webpack re-bundle, and the browser refresh automatically as soon as you save.

Currently the loader only supports HXML files which export exactly one output, so you cannot use `--next` to build multiple things.  Instead you can use multiple hxml files and list each of them in Webpack.

If you try to build a hxml file that is for another target, like Neko, PHP or CPP - the hxml file will be executed and an empty JS file will be passed on to webpack, which you can safely ignore.  (If anyone knows how to have a loader inform webpack that no output is required let me know!)

### Example webpack configuration

```js
module.exports = {
    entry: {
        client: './client.hxml',
        server: './server.hxml', // Could compile PHP or Neko etc, does not have to be JS.
    },
    output: {
        path: __dirname + "/www/assets",
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            // Have a rule that explains hxml files should use `haxe-loader`.
            {
                test: /\.hxml$/,
                loader: 'haxe-loader',
            }
        ]
    },
};
```

You can also add some convenience scripts to your `package.json`:

    "scripts": {
        "webpack": "webpack",
        "watch": "webpack --watch"
    },

Now you can run:

    - `yarn run webpack` - Use webpack to compile your entry point (or entry points)
    - `yarn run watch` - Watch for changes and recompile automatically

Please note `npm run ...` also works just fine.

### Requiring files

Note: you must add `-lib haxe-loader` to your HXML to use the `Webpack` class.

#### Synchronous requires

To require 3rd party NPM modules, you can use `@:jsRequire` metadata or
[`js.Lib.require()`](http://api.haxe.org/js/Lib.html#require).

However, those requires are relative to you HXML file! 
It also cannot be compiled on platforms other than JS.

It is thus recommended to call instead:

```haxe
Webpack.require('./MyFile.css');    // requires a CSS loader
Webpack.require('../locales.json'); // requires to enable JS loader for JSON
```

It is silently ignored on non-JS targets. 
In future we may try to handle require statements for other targets.

#### Asynchronous requires (code splitting)

To leverage code splitting, you must use the `Webpack.async` require, 
and provide the Haxe module you want to load as a separate bundle:

```haxe
import com.MyComponent;
...
Webpack.async(MyComponent).then(function(_){
    var comp = new myComponent();
});
```

Using this API, the Haxe compiler output will be processed and cut into separate files.

### Dev server setup

You can use [webpack-dev-server](https://webpack.js.org/configuration/dev-server/) to watch changes and auto-refresh a page after Haxe has compiled any changes.

Install `webpack-dev-server`

    yarn add --dev webpack-dev-server    # Or you can `npm install --dev webpack-dev-server`

Add some configuration to your `webpack.config.js`:

    devServer: {
        contentBase: "./www",   // Your web root is in the "www" folder
        publicPath: "/assets/", // The JS or assets webpack is building are in "www/assets"
        overlay: true,          // Display compilation errors in the browser
    },

Add a script to your `package.json`:

    "scripts": {
        "start": "webpack-dev-server --open",
    },

Run `yarn run start` to start the development server.

If you have a backend you want to use, for example Nekotools running on `http://localhost:2000`, webpack-dev-server comes with a proxy:

    devServer: {
        contentBase: "./www",
        overlay: true,
        proxy: {
            "/": {
                changeOrigin: true,
                target: "http://localhost:2000"
            }
        },
        publicPath: "/js/"
    },

### Copyright and License

Created by Jason O'Neil in 2017.  Released under the MIT license.
