'use_strict';

const loaderUtils = require('loader-utils');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const tmp = require('tmp');
const hash = require('hash-sum');
const split = require('haxe-modular/tool/bin/split');
const hooks = require('haxe-modular/bin/hooks');
const tokenize = require('yargs-parser/lib/tokenize-arg-string');

const cache = Object.create(null);
// resolve hooks once
const graphHooks = hooks.getGraphHooks();

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
    const { jsOutputFile, classpath, args } = prepare(
        options,
        context,
        ns,
        hxmlContent,
        jsTempFile
    );

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
                cb(null, '// ' + Math.random());
            }, delay);
            return;
        }

        // Read the resulting JS file and return the main module
        const processed = processOutput(ns, jsTempFile, jsOutputFile, options);
        if (processed) {
            updateCache(context, ns, processed, classpath);
        }
        returnModule(context, ns, null /* entry point */, cb);
    });
};

function updateCache(context, ns, { contentHash, results }, classpath) {
    cache[ns] = { contentHash, results, classpath };
}

function processOutput(ns, jsTempFile, jsOutputFile, options) {
    const content = fs.readFileSync(jsTempFile.path);
    // Check whether the output has changed since last build
    const contentHash = hash(content);
    if (cache[ns] && cache[ns].hash === contentHash) return null;
    // Split output
    const modules = findImports(content);
    const sourcemaps = fs.existsSync(`${jsTempFile.path}.map`);
    const sizeReport = !!options.sizeReport;
    const results = split
        .run(
            jsTempFile.path,
            jsOutputFile,
            modules,
            sourcemaps,
            true /* commonjs - required */,
            false /* debug sourcemap - unsupported*/,
            sizeReport,
            graphHooks
        )
        .filter(entry => entry && entry.source);

    // Inject .hx sources in map file
    results.forEach(entry => {
        if (entry.map) {
            const map = entry.map.content;
            map.sourcesContent = map.sources.map(path => getSystemPath(path)).map(path => {
                try {
                    return fs.readFileSync(path).toString();
                } catch (_) {
                    return `/*\n Source not found:\n ${path}\n*/`;
                }
            });
        }
    });

    // Delete temp files
    jsTempFile.cleanup();

    return { contentHash, results };
}

function getSystemPath(path) {
    // remove 'file://' prefix
    if (path.startsWith('file://')) path = path.substr(7);
    // Windows path fix
    if (/^\/[a-z]:/i.test(path)) path = path.substr(1);
    return path;
}

function returnModule(context, ns, name, cb) {
    const { results, classpath } = cache[ns];
    if (!results.length) {
        throw new Error(`${ns}.hxml did not emit any modules`);
    }
    if (name == null) {
        // entry point is always first module
        name = results[0].name;
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
    // Webpack.load() emits a call to import() with a query to haxe-loader,
    // with a chunk name (unless -D webpack_nonamedchunks):
    // - import("!haxe-loader?hxmlName/moduleName")
    // - import(/* webpackChunkName: "moduleName" */ "!haxe-loader?hxmlName/moduleName")
    const reImports = /import\((\/\*[^*]+\*\/ )?"!haxe-loader\?([^!]+)/g;
    const results = [];

    let match = reImports.exec(content);
    while (match) {
        // Module reference  is of the form 'hxmlName/moduleName'
        const name = match[2].substr(match[2].indexOf('/') + 1);
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
    let args = [];
    const classpath = [];
    let jsOutputFile = null;
    let mainClass = 'Main';
    let preventJsOutput = false;

    // Add args that are specific to hxml-loader
    if (options.debug) {
        args.push('-debug');
    }
    args.push('-D', `webpack_namespace=${ns}`);

    // Merge hxml and options.extra
    let flatHxml = hxmlContent.split('\n').filter(l => !l.startsWith('#')).join(' ');
    if (options.extra) flatHxml += ' ' + options.extra;

    // Parse arguments for Haxe
    const hxmlOptions = tokenize(flatHxml);
    const len = hxmlOptions.length;

    // Process all of the args in the hxml file.
    for (let i = 0; i < len; i++) {
        const name = hxmlOptions[i];

        if (name === '--next') {
            var err = `${
                context.resourcePath
            } included a "--next" line, hxml-loader only supports a single build per hxml file.`;
            throw new Error(err);
        }

        if (name === '-js' && !preventJsOutput) {
            jsOutputFile = hxmlOptions[++i];
            args.push(name, jsTempFile.path);
            continue;
        }

        if (name === '-cp') {
            i++;
            classpath.push(path.resolve(hxmlOptions[i]));
            args.push(name, `"${path.resolve(hxmlOptions[i])}"`);
            continue;
        }

        if (name === '-D') {
            const value = hxmlOptions[++i];
            if (value === 'prevent-webpack-js-output') {
                preventJsOutput = true;
                if (jsOutputFile) {
                    // If a JS output file was already set to use a webpack temp file, go back and undo that.
                    args = args.map(arg => (arg === jsTempFile.path ? value : arg));
                    jsOutputFile = null;
                }
            }

            args.push(name, `"${value}"`);
            continue;
        }

        if (name === '-lib') {
            const value = hxmlOptions[++i];

            if (/^modular(:|$)/.test(value)) {
                throw new Error(
                    'When using haxe-loader, you need to remove `-lib modular` from your hxml file'
                );
            }

            args.push(name, value);
            continue;
        }

        // Quote arguments that may need it
        if (name === '--macro' || name === '-resource' || name === "--cwd" || name === "-cmd") {
            const value = hxmlOptions[++i];
            args.push(name, `"${value}"`);
            continue;
        }

        // Add all other arguments as-is
        args.push(name);
    }

    return { jsOutputFile, classpath, args };
}
