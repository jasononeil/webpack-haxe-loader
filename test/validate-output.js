const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const { assertInModule, extractModules } = require('./util');

const suite = [validateTest1, validateTest2, validateTest1_es6, validateTest2_es6];

function runSuite() {
    if (!suite.length) {
        console.log('SUCCESS');
    } else {
        const testCase = suite.shift();
        testCase(runSuite);
    }
}

function validateTest1(callback) {
    console.log('[Validate] test1');
    const output = path.resolve(__dirname, 'dist/bundle1.js');

    const src = fs.readFileSync(output).toString();
    const modules = extractModules(src);
    // Haxe entry point
    // test.json

    assertInModule('./test1.hxml', modules, 'Test1 Haxe module', [
        '/* injected header */',
        'var Test1 = function',
        'Test1.main()',
        '/*! ./src/test.json */', // require('./index.json')
        '/*! null-loader!./util.js */' // require('null-loader!../utils.js')
    ]);

    assertInModule('./src/test.json', modules, 'Included `test.json` module', [
        'module.exports = {"answer":42}'
    ]);

    runOutput(output, callback);

    assertSizeReportExists('dist/test1.js');
}

function validateTest2(callback) {
    console.log('[Validate] test2');
    const output = path.resolve(__dirname, 'dist/bundle2.js');
    const output2 = path.resolve(__dirname, 'dist/0.bundle2.js');

    let src = fs.readFileSync(output).toString();
    let modules = extractModules(src);
    // Haxe entry point

    assertInModule('./test2.hxml', modules, 'Test2 Haxe module', [
        'var Test2 = function',
        'Test2.main()',
        'var Test2Sub', // host
        'Test2Sub = $s.Test2Sub', // bridge
        '/*! haxe-loader?test2/Test2Sub */' // import Test2Sub
    ]);

    src = fs.readFileSync(output2).toString();
    modules = extractModules(src);
    // Haxe split bundle

    assertInModule('../index.js?test2/Test2Sub!./', modules, 'Test2Sub Haxe module', [
        'var Test2Sub = function',
        '$s.Test2Sub = Test2Sub' // export
    ]);

    runOutput(output, callback);

    assertSizeReportExists('dist/test2.js');
}

function validateTest1_es6(callback) {
    console.log('[Validate] test1-es6');
    const output = path.resolve(__dirname, 'dist/bundle1-es6.js');

    const src = fs.readFileSync(output).toString();
    const modules = extractModules(src);
    // Haxe entry point
    // test.json

    assertInModule('./test1-es6.hxml', modules, 'Test1 Haxe module ES6', [
        'class Test1',
        'Test1.main()',
        '/*! ./src/test.json */', // require('./index.json')
        '/*! null-loader!./util.js */' // require('null-loader!../utils.js')
    ]);

    assertInModule('./src/test.json', modules, 'Included `test.json` module', [
        'module.exports = {"answer":42}'
    ]);

    runOutput(output, callback);

    assertSizeReportExists('dist/test1-es6.js');
}

function validateTest2_es6(callback) {
    console.log('[Validate] test2-es6');
    const output = path.resolve(__dirname, 'dist/bundle2-es6.js');
    const output2 = path.resolve(__dirname, 'dist/0.bundle2-es6.js');

    let src = fs.readFileSync(output).toString();
    let modules = extractModules(src);
    // Haxe entry point

    assertInModule('./test2-es6.hxml', modules, 'Test2 Haxe module ES6', [
        'class Test2',
        'Test2.main()',
        'var Test2Sub', // host
        'Test2Sub = $s.Test2Sub', // bridge
        '/*! haxe-loader?test2-es6/Test2Sub */' // import Test2Sub
    ]);

    src = fs.readFileSync(output2).toString();
    modules = extractModules(src);
    // Haxe split bundle

    assertInModule('../index.js?test2-es6/Test2Sub!./', modules, 'Test2Sub Haxe module ES6', [
        'class Test2Sub',
        '$s.Test2Sub = Test2Sub' // export
    ]);

    runOutput(output, callback);

    assertSizeReportExists('dist/test2-es6.js');
}

function assertSizeReportExists(filename) {
    if (!fs.existsSync(path.resolve(__dirname, filename + '.stats.html')))
        throw `Size report missing: ${filename}.stats.html`;
    if (!fs.existsSync(path.resolve(__dirname, filename + '.stats.json')))
        throw `Size report missing: ${filename}.stats.json`;
}

function runOutput(output, callback) {
    exec(`node ${output}`, (err, stdout, stderr) => {
        if (err) {
            console.log(stdout);
            console.log(stderr);
            throw `Failed to run ${output}`;
        }
        console.log(stdout);
        callback();
    });
}

runSuite();
