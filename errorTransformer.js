'use strict';

const problemMatcher = require('./errorParser').problemMatcher;

function stripMessageHeader(errorMessage) {
    if (!errorMessage) return errorMessage;

    const messageHeaderReg = /^(Module\sError|Module\sWarning|Module\sbuild\sfailed).*?:$/;
    const lines = errorMessage.split('\n');

    if (messageHeaderReg.test(lines[0])) {
        lines.shift();
        return lines.join('\n');
    }

    return errorMessage;
}

function isHaxeError(error, message) {
    return (error.name == 'ModuleError' || error.name == 'ModuleWarning')
        && message
        && problemMatcher.test(message);
}

function isHaxeCompilationError(error, message) {
    return error.name == 'ModuleBuildError'
        && message
        && message.split('\n').shift().indexOf('Haxe Loader: ') > -1;
}

function isHaxeCompilationOutput(error, message) {
    return error.name == 'ModuleWarning'
        && message
        && message.indexOf('[HAXE STDOUT]\n') === 0;
}

function transform(error) {
    const message = stripMessageHeader(error.message);

    if (isHaxeError(error, message)) {
        const res = problemMatcher.exec(message);

        return Object.assign({}, error, {
            file: res[1],
            message: res[7],
            positions: res.slice(2, 6),
            origin: '\n @ ' + error.file,
            type: 'Haxe ' + (res[6] || 'Error')
        });
    }

    if (isHaxeCompilationError(error, message)) {
        const lines = message.split('\n');

        const first = lines.shift();
        let newMessage = 'Compilation failed';
        const reg = /Haxe Loader: (.*)$/;
        if (reg.test(first)) newMessage = reg.exec(first)[1];

        return Object.assign({}, error, {
            type: 'Haxe Compilation Error',
            message: newMessage,
            infos: lines.join('\n')
        });
    }

    if (isHaxeCompilationOutput(error, message)) {
        const lines = message.split('\n');
        lines.shift();

        return Object.assign({}, error, {
            type: 'Haxe Compilation Output',
            message: lines.join('\n')
        });
    }

    return error;
}

module.exports = transform;
