/**
 * In `src`, match all the cases in `tests`, or throw an error
 */
function assertInModule(src, title, tests) {
    tests.forEach(test => {
        if (src.indexOf(test) < 0) {
            throw `FAILED: ${title} should contain "${test}"`;
        }
    });
}

/**
 * Extract/butcher individual module source from webpack-generated JS
 */
function extractModules(src) {
    const reModule = /\/\* ([0-9]+) \*\/\n\/\*\*\*\/ \(function/;
    let m, last;
    const result = [];
    while (m = reModule.exec(src)) {
        if (last) result.push(src.substr(0, m.index));
        last = m;
        src = src.substr(m.index + m[0].length);
    }
    if (last) result.push(src);
    return result;
}

module.exports = {
    assertInModule,
    extractModules
};
