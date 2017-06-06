const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

module.exports = function(hxmlContent) {
    if (this.cacheable) {
        this.cacheable();
    }
    const cb = this.async();

    let jsOutputFile = null;
    let haxeBuildInfoFile = '_tmp_haxe_build_info.json';
    let args = [];

    // Add args that are specific to hxml-loader
    if (this.debug) {
        args.push('-debug');
    }
    // We use a special macro to output a file containing all `*.hx` source files used in the haxe build.
    // We can then use this to register them as webpack dependencies so they will be watched for changes.
    args.push('-cp');
    args.push(`"${__dirname}/macro/"`);
    args.push('--macro');
    args.push(`"WebpackLoaderUtil.outputJson('${haxeBuildInfoFile}')"`);

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
            var err = `${this
                .resourcePath} included a "--next" line, hxml-loader only supports a single JS build per hxml file.`;
            return cb(err);
        }

        if (space > -1) {
            let value = line.substr(space + 1).trim();
            args.push(value);

            if (name === '-js') {
                jsOutputFile = value;
            }
        }
    }

    if (!jsOutputFile) {
        var err = `${this
            .resourcePath} did not include a "-js" line, hxml-loader only supports a single JS build per hxml file.`;
        return cb(err);
    }

    // Execute the Haxe build.
    exec(`haxe ${args.join(' ')}`, (err, stdout, stderr) => {
        if (stdout) {
            console.log(stdout);
        }
        if (stderr) {
            console.error(stderr);
        }
        if (err) {
            return cb(err);
        }

        // TODO: use promises here to avoid callback crazyness.

        // Read the Haxe build info so we can register dependencies.
        fs.readFile(haxeBuildInfoFile, (err, json) => {
            if (err) return cb(err);

            var data = JSON.parse(json);
            for (let file of data.modules) {
                var filePath = path.resolve(file);
                this.addDependency(filePath);
            }

            // Delete the temporary build info file.
            fs.unlink(haxeBuildInfoFile, err => {
                if (err) return cb(err);

                // Read the resulting JS file.
                fs.readFile(jsOutputFile, (err, data) => {
                    if (err) return cb(err);

                    return cb(null, data);
                });
            });
        });
    });
};
