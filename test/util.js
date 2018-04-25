/**
 * In `src`, match all the cases in `tests`, or throw an error
 */
function assertInModule(index, src, title, tests) {
    if (!src) throw `FAILED: ${title} does not have a module ${index}`;
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
    const reModule = /\/\* ([0-9]+) \*\/\n\/\*\*\*\/ \(function/;
    return splitSrc(src, reModule);
}

/**
 * Extract/butcher individual module source from webpack-generated chunk JS
 */
function extractChunks(src) {
    const reChunk = /\/\*\*\*\/ ([0-9]+):\n\/\*\*\*\/ \(function/;
    return splitSrc(src, reChunk);
}

function splitSrc(src, re) {
    let m, last;
    const result = [];
    while (m = re.exec(src)) {
        if (last) result[+last[1]] = src.substr(0, m.index);
        last = m;
        src = src.substr(m.index + m[0].length);
    }
    if (last) result[+last[1]] = src;
    return result;
}

module.exports = {
    assertInModule,
    extractModules,
    extractChunks
};
