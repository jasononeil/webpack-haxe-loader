'use strict';

const fs = require('fs');
const chalk = require('chalk');

const concat = require('./utils').concat;
const formatTitle = require('./utils/colors').formatTitle;

const MAX_LINES = 12;
const LINES_AROUND = 2;
const LINES_INSIDE = 4;

function formatError(error) {
    const severity = 'error';
    const baseError = formatTitle(severity, severity);
    const file = removeLoaders(error.file);
    const src = fs.readFileSync(file, {encoding: 'utf-8'});

    return concat(
        `${baseError} in ${file}`,
        '',
        error.message,
        '',
        displaySource(src, error.positions),
        ''
    ).join('\n');
}

function formatWarning(warning) {
    const severity = 'warning';
    const baseError = formatTitle(severity, severity);
    const file = removeLoaders(warning.file);
    const src = fs.readFileSync(file, {encoding: 'utf-8'});

    return concat(
        `${baseError} in ${file}`,
        '',
        warning.message,
        '',
        displaySource(src, warning.positions, 5, 0, 2),
        ''
    ).join('\n');
}

function formatCompilationError(error) {
    const severity = 'error';
    const baseError = formatTitle(severity, severity);
    const color = error.message === 'Compilation failed' ? chalk.grey : chalk.white;

    return concat(
        `${baseError} ${removeLoaders(error.file)}: ${error.message}`,
        '',
        color(error.infos),
        ''
    ).join('\n');
}

function formatCompilationOutput(error) {
    const severity = 'info';
    const baseError = formatTitle(severity, severity);

    return concat(
        `${baseError} Compilation output for ${removeLoaders(error.file)}`,
        '',
        error.message
    ).join('\n');
}

function removeLoaders(file) {
    if (!file) return '';

    const split = file.split('!');
    const filePath = split[split.length - 1];
    return `${filePath}`;
}

function displaySource(
    src,
    [line, endLine, column, endColumn],
    maxLines = MAX_LINES,
    linesAround = LINES_AROUND,
    linesInside = LINES_INSIDE
) {
    if (src == null) return chalk.red('Cannot get source code for this error');
    const lines = src.split('\n');

    if (line > lines.length) {
        return chalk.red('Invalid error: cannot find line #' + line);
    }

    const ret = [];
    line = line | 0;
    endLine = (endLine || line) | 0;
    const nbLines = endLine - line + 1;

    let start = line - linesAround;
    if (start < 1) start = 1;

    let end = endLine + linesAround;
    if (end >= lines.length) end = lines.length - 1;
        if (!endColumn && endColumn !== 0) endColumn = column;

    for (let i = start; i <= end; i++) {
        const sourceLine = lines[i - 1];
        if (i == start && i != line && sourceLine.trim() == '') continue;

        const isHighlighted = (i >= line && i <= endLine);
        const color = isHighlighted ? chalk.white : chalk.grey;

        if (isHighlighted && nbLines > maxLines) {
            if (i - line == linesInside) {
                ret.push(chalk.grey(' [...]'));
                continue;
            } else if (i - line > linesInside && endLine - i >= linesInside) {
                continue;
            }
        }

        let lineStr = color(isHighlighted ? '> ' : '  ');
        lineStr += color(lpad(i, String(end).length) + ' | ');

        if (isHighlighted && line == endLine && column >= 0) {
            lineStr += chalk.grey(sourceLine.substring(0, column - 1));
            lineStr += chalk.white(sourceLine.substring(column - 1, endColumn - 1));

            if (sourceLine.length >= endColumn) {
                lineStr += chalk.grey(sourceLine.substring(endColumn - 1));
            }
        } else {
            lineStr += color(sourceLine);
        }

        ret.push(lineStr);
    }

    return ret.join('\n');
}

function lpad(str, len, ch) {
    str = String(str);
    let i = -1;
    if (!ch && ch !== 0) ch = ' ';
    len = len - str.length;
    while (++i < len) str = ch + str;
    return str;
}

function format(errors, type) {
    let stdout;
    let formattedErrors = [];

    errors.sort((e1, e2) => {
        const i1 = (e1.webpackError.error && e1.webpackError.error.index) || -1;
        const i2 = (e2.webpackError.error && e2.webpackError.error.index) || -1;

        if (i1 == -1 && i2 == -1) return 0;
        return i1 - i2;
    });

    errors = groupErrors(errors);

    errors.forEach(error => {
        switch (error.type) {
            case 'Haxe Error':
                formattedErrors.push(formatError(error));
                break;

            case 'Haxe Warning':
                formattedErrors.push(formatWarning(error));
                break;

            case 'Haxe Compilation Output':
                stdout = formatCompilationOutput(error);
                break;

            case 'Haxe Compilation Error':
                formattedErrors.push(formatCompilationError(error));
                break;
        }
    });

    if (stdout) formattedErrors = formattedErrors.concat(['', stdout]);
    return formattedErrors;
}

function groupErrors(errors) {
    const map = {};
    const other = [];

    errors.forEach(error => {
        if (error.type != 'Haxe Error') return other.push(error);

        const key = error.file + ':' + error.positions.join(':');

        if (map[key]) map[key].message += '\n' + error.message;
        else map[key] = error;
    });

    const groupedErrors = [];
    for (let k in map) if (map.hasOwnProperty(k)) groupedErrors.push(map[k]);
    return groupedErrors.concat(other);
}

module.exports = format;
