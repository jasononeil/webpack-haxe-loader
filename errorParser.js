'use strict';

// 1: file, 2: line, 3: endline, 4: column, 5: endColumn, 6: severity, 7: message
const problemMatcher = new RegExp(
    "^(.+):(\\d+): (?:lines \\d+-(\\d+)|character(?:s (\\d+)-| )(\\d+)) : (?:(Warning) : )?(.*)\r?$"
);

const fatalErrorMatcher = new RegExp("^Fatal error: (.*)$");

function identifyError(error) {
    if (!error) return false;
    if (problemMatcher.test(error)) return true;
    if (fatalErrorMatcher.test(error)) return true;
    return false;
}

module.exports = {
    problemMatcher,
    identifyError
};

