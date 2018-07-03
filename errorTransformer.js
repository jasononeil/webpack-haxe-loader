'use strict';

// 1: file, 2: line, 3: endline, 4: column, 5: endColumn, 6: severity, 7: message
const problemMatcher = new RegExp(
    "^(.+):(\\d+): (?:lines \\d+-(\\d+)|character(?:s (\\d+)-| )(\\d+)) : (?:(Warning) : )?(.*)\r?$"
);

function isHaxeError(error) {
    return (error.name == 'ModuleError' || error.name == 'ModuleWarning')
        && error.message
        && problemMatcher.test(error.message);
}

function isHaxeCompilationError(error) {
    return error.name == 'ModuleBuildError'
        && error.message
        && error.message.split('\n').shift().indexOf('Haxe Loader: ') > -1;
}

function isHaxeCompilationOutput(error) {
    return error.name == 'ModuleWarning'
        && error.message
        && error.message.indexOf('[HAXE STDOUT]\n') === 0;
}

function transform(error) {
    if (isHaxeError(error)) {
        const res = problemMatcher.exec(error.message);

        return Object.assign({}, error, {
            file: res[1],
            message: res[7],
            positions: res.slice(2, 6),
            origin: '\n @ ' + error.file,
            type: 'Haxe ' + (res[6] || 'Error')
        });
    }

    if (isHaxeCompilationError(error)) {
        const lines = error.message.split('\n');

        const first = lines.shift();
        let message = "Compilation failed";
        const reg = /Haxe Loader: (.*)$/;
        if (reg.test(first)) message = reg.exec(first)[1];

        return Object.assign({}, error, {
            type: 'Haxe Compilation Error',
            message: message,
            infos: lines.join('\n')
        });
    }

    if (isHaxeCompilationOutput(error)) {
        const lines = error.message.split('\n');
        lines.shift();

        return Object.assign({}, error, {
            type: 'Haxe Compilation Output',
            message: lines.join('\n')
        });
    }

    return error;
}

module.exports = transform;
