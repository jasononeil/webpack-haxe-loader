# Why using Webpack?

There are several reasons for doing this:

- If you are going to use NPM libraries as externs, you need to compile with Webpack or 
  Browserify etc. Having the two compile steps (Haxe and Webpack) makes it easier.
- There's a good chance you'll want Webpack anyway for compiling CSS (or SASS or LESS), 
  managing static assets, or minifying the resulting JS bundle.
- When Webpack is set up right, it has a nice development experience, with things like:
    - `webpack --watch` to watch any changes you make to a file and recompile.
    - `webpack-dev-server` to hot-reload a page based on changes you make.

## Compile/recompile Haxe JavaScript, or other targets

With this loader, you are able to:

- Require a HXML file as any other asset in Webpack.
- Change any `*.hx` source file from your classpath, and have Haxe re-compile, 
  Webpack re-bundle, and the browser refresh automatically as soon as you save.

If you try to build a hxml file that is for another target, like Neko, PHP or CPP, 
the compilation will be executed and an empty JS file will be passed on to Webpack, 
which you can safely ignore - see below for details.

## Convenience scripts

This isn't really a Webpack feature, but if you use `npm` or `yarn`,
you can add quick scripts to your `package.json`:

```json
    "scripts": {
        "build": "webpack -p",
        "start": "webpack-dev-server --open",
        "server": "cd www && nodemon server.js",
        "test": "cd www && node test.js",
        "test_watch": "cd www && nodemon test.js"
    },
```

Which you can run:

    - `yarn build` - Use webpack to build a production copy of your app
    - `yarn start` - Start the webpack dev server, which will watch for changes, recompile and refresh the browser.
    - `yarn server` - Start a NodeJS server (if "www/server.js" is a NodeJS file you have compiled)
    - `yarn test` - Run a test suite once (if "www/test.js" is a NodeJS file you have compiled)
    - `yarn test_watch` - Build and run a test suite on every change (if "www/test.js" is a NodeJS file you have compiled)

Tips:

- `npm run ...` also works just fine.
- If you create a `clean` action, run it as `yarn run clean` and not `yarn clean`.

## Dev server setup

You can use [webpack-dev-server](https://webpack.js.org/configuration/dev-server/) 
to watch changes and auto-refresh a page after Haxe has compiled any changes.

Install `webpack-dev-server`:

    yarn add webpack-dev-server --dev

or

    npm install webpack-dev-server --save-dev

Add some configuration to your `webpack.config.js`:

    devServer: {
        contentBase: "./www",   // Your web root is in the "www" folder
        publicPath: "/assets/", // The JS or assets webpack is building are in "www/assets"
        overlay: true           // Display compilation errors in the browser
    },

Add a script to your `package.json`:

    "scripts": {
        "start": "webpack-dev-server --open",
    },

Run `yarn run start` to start the development server.

If you have a dev backend you want to use, for example Nekotools running 
on `http://localhost:2000`, webpack-dev-server comes with a proxy:

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

## Compiling non-JS assets

You can use Webpack and haxe-loader to compile all of your hxml files, not just those 
targeting client side Javascript. This way you can have Webpack watch, rebuild and 
refresh your page for PHP, NodeJS, Neko, etc.

When you use this option, Haxe will output the compilation files specified in your HXML 
file, but Webpack will still emit a JS bundle. 

For example, you might end up with a file named `php-server.bundle.js`. If you look inside, 
you'll realise that this file contains nothing other than some webpack boilerplate.

- You do not need to include this file as a script in your HTML.
- If you do however, webpack-dev-server will know to refresh the page every time the 
  PHP files are rebuilt.

If you are using NodeJS as a server, and would like it to restart after a compilation, 
you can use "nodemon":

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
