/**
 * In `src`, match all the cases in `tests`, or throw an error
 */
function assertInModule(name, modules, title, tests) {
    const src = modules[name];
    if (!src) throw `FAILED: ${title} does not have a module ${name}`;
    tests.forEach(test => {
        if (src.indexOf(test) < 0) {
            throw `FAILED: ${title} should contain "${test}"\n\n[...]${src}`;
        }
    });
}

/**
 * Extract/butcher individual module source from webpack-generated JS
 */
function extractModules(src) {
    const reModule = /\n\/\*\*\*\/ "([^"]+)":/;
    return splitSrc(src, reModule);
}

function splitSrc(src, re) {
    let m, last;
    const result = {};
    while ((m = re.exec(src))) {
        if (last) result[last] = trimSrc(src.substr(0, m.index));
        last = m[1];
        src = src.substr(m.index + m[0].length);
    }
    if (last) result[last] = trimSrc(src);
    return result;
}

function trimSrc(src) {
    return src.substr(0, src.lastIndexOf('/***/ })') + 8);
}

module.exports = {
    assertInModule,
    extractModules
};
