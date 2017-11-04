"use_strict";

const loaderUtils = require('loader-utils');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const tmp = require('tmp');
const hash = require('hash-sum');
const split = require('haxe-modular/tool/bin/split');

const cache = Object.create(null);

module.exports = function(hxmlContent) {
    const context = this;
    const options = loaderUtils.getOptions(context) || {};
    context.cacheable && context.cacheable();
    const cb = context.async();

    const request = context.resourcePath;
    if (!request) {
        // Loader was called without specifying a hxml file
        // Expecting a require of the form '!haxe-loader?hxmlName/moduleName!'
        fromCache(context, context.query, cb);
        return;
    }

    const ns = path.basename(request).replace('.hxml', '');
    const jsTempFile = makeJSTempFile(ns);
    const { jsOutputFile, classpath, args } = prepare(options, context, ns, hxmlContent, jsTempFile);

    registerDepencencies(context, classpath);

    // Execute the Haxe build.
    console.log('haxe', args.join(' '));
    exec(`haxe ${args.join(' ')}`, (err, stdout, stderr) => {
        if (err) {
            return cb(err);
        }

        // If the hxml file outputs something other than client JS, we should not include it in the bundle.
        // We're only passing it through webpack so that we get `watch` and the like to work.
        if (!jsOutputFile) {
            // We allow the user to configure a timeout so the server has a chance to restart before webpack triggers a page refresh.
            var delay = options.delayForNonJsBuilds || 0;
            setTimeout(() => {
                // We will include a random string in the output so that the dev server notices a difference and triggers a page refresh.
                cb(null, "// " + Math.random())
            }, delay);
            return;
        }

        // Read the resulting JS file and return the main module
        const processed = processOutput(ns, jsTempFile, jsOutputFile);
        if (processed) {
            updateCache(context, ns, processed, classpath);
        }
        returnModule(context, ns, 'Main', cb);
    });
};

function updateCache(context, ns, { contentHash, results }, classpath) {
    cache[ns] = { contentHash, results, classpath };
}

function processOutput(ns, jsTempFile, jsOutputFile) {
    const content = fs.readFileSync(jsTempFile.path);
    // Check whether the output has changed since last build
    const contentHash = hash(content);
    if (cache[ns] && cache[ns].hash === contentHash)
        return null;

    // Split output
    const modules = findImports(content);
    const debug = fs.existsSync(`${jsTempFile.path}.map`);
    const results = split.run(jsTempFile.path, jsOutputFile, modules, debug, true)
        .filter(entry => entry && entry.source);

    // Inject .hx sources in map file
    results.forEach(entry => {
        if (entry.map) {
            const map = entry.map.content = JSON.parse(entry.map.content);
            map.sourcesContent = map.sources.map(path => {
                try {
                    if (path.startsWith('file:///')) path = path.substr(8);
                    return fs.readFileSync(path).toString();
                } catch (_) {
                    return '';
                }
            });
        }
    });

    // Delete temp files
    jsTempFile.cleanup();

    return { contentHash, results };
}

function returnModule(context, ns, name, cb) {
    const { results, classpath } = cache[ns];
    if (!results.length) {
        throw new Error(`${ns}.hxml did not emit any modules`);
    }

    const entry = results.find(entry => entry.name === name);
    if (!entry) {
        throw new Error(`${ns}.hxml did not emit a module called '${name}'`);
    }

    cb(null, entry.source.content, entry.map ? entry.map.content : null);
}

function fromCache(context, query, cb) {
    // To locate a split module we expect a query of the form '?hxmlName/moduleName'
    const options = /\?([^/]+)\/(.*)/.exec(query);
    if (!options) {
        throw new Error(`Invalid query: ${query}`);
    }
    const ns = options[1];
    const name = options[2];

    const cached = cache[ns];
    if (!cached) {
        throw new Error(`${ns}.hxml is not a known entry point`);
    }

    registerDepencencies(context, cached.classpath);

    if (!cached.results.length) {
        throw new Error(`${ns}.hxml did not emit any modules`);
    }
    returnModule(context, ns, name, cb);
}

function findImports(content) {
    // Webpack.load() emits a call to System.import with a query to haxe-loader
    const reImports = /System.import\("!haxe-loader\?([^!]+)/g;
    const results = [];

    let match = reImports.exec(content);
    while (match) {
        // Module reference  is of the form 'hxmlName/moduleName'
        const name = match[1].substr(match[1].indexOf('/') + 1);
        results.push(name);
        match = reImports.exec(content);
    }
    return results;
}

function makeJSTempFile() {
    const path = tmp.tmpNameSync({ postfix: '.js' });
    const nop = () => {};
    const cleanup = () => {
        fs.unlink(path, nop);
        fs.unlink(`${path}.map`, nop);
    };
    return { path, cleanup };
}

function registerDepencencies(context, classpath) {
    // Listen for any changes in the classpath
    classpath.forEach(path => context.addContextDependency(path));
}

function prepare(options, context, ns, hxmlContent, jsTempFile) {
    const args = [];
    const classpath = [];
    let jsOutputFile = null;
    let mainClass = 'Main';
    let isNodeJs = false;

    // Add args that are specific to hxml-loader
    if (options.debug) {
        args.push('-debug');
    }
    args.push('-D', `webpack_namespace=${ns}`);

    // Process all of the args in the hxml file.
    for (let line of hxmlContent.split('\n')) {
        line = line.trim();
        if (line === '' || line.substr(0, 1) === '#') {
            continue;
        }

        let space = line.indexOf(' ');
        let name = space > -1 ? line.substr(0, space) : line;
        args.push(name);

        if (name === '--next') {
            var err = `${context.resourcePath} included a "--next" line, hxml-loader only supports a single build per hxml file.`;
            throw new Error(err);
        }

        if (space > -1) {
            let value = line.substr(space + 1).trim();

            if (name === '-js' && !isNodeJs) {
                jsOutputFile = value;
                args.push(jsTempFile.path);
                continue;
            }

            if (name === '-cp') {
                classpath.push(path.resolve(value));
            }

            if (name === '-lib' && value == 'hxnodejs') {
                isNodeJs = true;
                if (jsOutputFile) {
                    // If a JS output file was already set to use a webpack temp file, go back and undo that.
                    args = args.map(arg => (arg === jsTempFile.path) ? value : arg);
                    jsOutputFile = null;
                }
            }

            args.push(value);
        }
    }

    if (options.extra) args.push(options.extra);

    return { jsOutputFile, classpath, args };
}
