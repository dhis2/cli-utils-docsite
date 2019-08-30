const path = require('path')

const resolvePath = p => path.resolve(p)

/**
 * @name Common Options
 * @description The following options are supported for both **build** and **start** commands
 * @kind mixin
 * @param {string} source=./docs - Path to documentation source files
 * @param {string} dest=./dest - Path to directory where `docsite` output should be created
 * @param {boolean} force=false - If true, forcibly re-download all external assets
 * @param {boolean} no-changelog - If set, do NOT copy the `changelogFile` to `CHANGELOG.md` in the output
 * @param {string} changelogFile=./CHANGELOG.md - Path to changelog source file
 * @param {string} jsdoc - One or more arrays of paths (or globs) to search for `jsdoc` comments
 * @param {string} jsdocOutputFile=jsdoc.md - The path, relative to `dest`, in which to write the `jsdoc` output
 */
module.exports = {
    source: {
        type: 'string',
        coerce: resolvePath,
        default: 'docs',
    },
    dest: {
        alias: 'o',
        type: 'string',
        coerce: resolvePath,
        default: 'dest',
    },
    force: {
        type: 'boolean',
        default: false,
    },
    changelog: {
        type: 'boolean',
        default: true,
    },
    changelogFile: {
        type: 'string',
        default: 'CHANGELOG.md',
    },
    configFile: {
        type: 'string',
        coerce: resolvePath,
        default: 'd2.config.js',
    },
    jsdoc: {
        type: 'array',
        description: 'The path glob(s) to parse with jsdoc',
        normalize: false,
    },
    jsdocOutputFile: {
        type: 'string',
        description: 'The output path for the generated JSDoc mardown file',
        default: 'jsdoc.md',
    },
}
