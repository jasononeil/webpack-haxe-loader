'use strict';

// 1: file, 2: line, 3: endline, 4: column, 5: endColumn, 6: severity, 7: message
const problemMatcher = new RegExp(
    "^(.+):(\\d+):\\s(?:lines\\s\\d+-(\\d+)|character(?:s\\s(\\d+)-|\\s)(\\d+))\\s:\\s(?:(Warning)\\s:\\s)?(.*)\\r?$"
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

