const fs = require('fs');
const path = require('path');
const chdir = require('process').chdir;
const exec = require('child_process').exec;

const suite = ['test1', 'test2'];

function validateOutput() {
    require('./validate-output');
}

function runSuite() {
    if (!suite.length) {
        validateOutput();
        return;
    }
    const testCase = suite.shift();
    runCase(testCase, runSuite);
}

function runCase(testCase, callback) {
    console.log(`[Webpack] ${testCase}`);

    exec(`npm run ${testCase}`, (err, stdout, stderr) => {
        if (err) {
            console.log(stdout);
            console.log(stderr);
            throw `Test case '${testCase}' failed`;
        }
        console.log(stdout);
        callback();
    });
}

function install(callback) {
    chdir(__dirname);
    exec('npm install', (err, stdout, stderr) => {
        if (err) {
            console.log(stdout);
            console.log(stderr);
            throw `Failed to run 'npm install' under /test`;
        }
        console.log(stdout);
        callback();
    });
}

const dist = `${__dirname}/dist/`;
if (!fs.existsSync(dist)) fs.mkdirSync(dist);

install(runSuite);
