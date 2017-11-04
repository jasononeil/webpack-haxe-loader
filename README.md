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

If you try to build a hxml file that is for another target, like Neko, PHP or CPP - the hxml file will be executed and an empty JS file will be passed on to webpack, which you can safely ignore - see below for details.

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

```json
    "scripts": {
        "build": "webpack -p",
        "start": "webpack-dev-server --open",
        "server": "cd www && nodemon server.js",
        "test": "cd www && node test.js",
        "test_watch": "cd www && nodemon test.js"
    },
```

Now you can run:

    - `yarn build` - Use webpack to build a production copy of your app
    - `yarn start` - Start the webpack dev server, which will watch for changes, recompile and refresh the browser.
    - `yarn server` - Start a NodeJS server (if "www/server.js" is a NodeJS file you have compiled)
    - `yarn test` - Run a test suite once (if "www/test.js" is a NodeJS file you have compiled)
    - `yarn test_watch` - Build and run a test suite on every change (if "www/test.js" is a NodeJS file you have compiled)

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
Webpack.require('./MyFile.css');    // requires a CSS file in the same directory as the current ".hx" file
Webpack.require('../locales.json'); // requires a JSON file in the parent directory of the current ".hx" file
```

It is silently ignored on non-JS targets.
In future we may try to handle require statements for other targets.

#### Asynchronous requires (code splitting)

To leverage code splitting, you must use the `Webpack.load` require,
and provide the Haxe module you want to load as a separate bundle:

```haxe
import com.MyComponent;
...
Webpack.load(MyComponent).then(function(_){
    var comp = new MyComponent();
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
        contentBase: "./www", // The server will run from this directory
        overlay: true, // If there are errors while rebuilding they will be overlayed on the page
        proxy: { // Proxy all requests to localhost:2000
            "/": {
                changeOrigin: true,
                target: "http://localhost:2000"
            }
        },
        publicPath: "/js/" // Webpack assets are compiled to this folder, these will be intercepted by the dev server (and not proxied).
    },

### Compiling non-JS assets

You can use Webpack and haxe-loader to compile all of your hxml files, not just those targeting client side Javascript.
This way you can have webpack watch, rebuild and refresh your page for PHP, NodeJS, Neko etc.

When you use this option, Haxe will output the compilation files specified in your hxml file, but Webpack will still emit a JS bundle.
For example, you might end up with a file named `php-server.bundle.js`.
If you look inside, you'll realise that this file contains nothing other than some webpack boilerplate.
You do not need to include this file as a script in your HTML.
If you do however, webpack-dev-server will know to refresh the page every time the PHP files are rebuilt.

If you are using NodeJS as a server, and would like it to restart after a compilation, you can use "nodemon":

    nodemon server.js

Given that there will be a delay between Haxe finishing building "server.js" and nodemon restarting the server, you may wish to delay webpack refreshing the page.
You can specify a delay in milliseconds using the "delayForNonJsBuilds" option:

```js
    module: {
        rules: [
            {
                test: /\.hxml$/,
                use: [{ loader: 'haxe-loader', options: {delayForNonJsBuilds: 300} }],
            },
        ],
    }
```

### Contributing

Don't hesitate to create a pull request. Every contribution is appreciated.

## Maintainers

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
