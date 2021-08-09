const path = require('path')

const resolvePath = p => path.resolve(p)
module.exports.resolvePath

/**
 * @name Common Options
 * @description The following options are supported for both **build** and **start** commands
 * @kind mixin
 * @param {string} dest=./dest - Path to directory where `docsite` output should be created <br/>_alias **o**_
 * @param {boolean} force=false - If true, forcibly re-download all external assets <br/>_alias **f**_
 * @param {boolean} no-changelog - If set, do NOT copy the `changelogFile` to `CHANGELOG.md` in the output
 * @param {string} changelogFile=./CHANGELOG.md - Path to changelog source file
 * @param {string} jsdoc - One or more arrays of paths (or globs) to search for `jsdoc` comments
 * @param {string} jsdocOutputFile=jsdoc.md - The path, relative to `dest`, in which to write the `jsdoc` output
 * @param {string} reactDocs - One or more paths or globs to entrypoint(s) to parse with React Docgen. Docs for components exported from these files will be generated
 * @param {string} reactDocsOutputFile=react-api.md - The path, relative to `dest`, in which to write the React docs output
 * @param {boolean} reactDocsLinkSource=false - If set, component filepaths in the generated markdown will link to that file on GitHub based on the `repository` field of `package.json`. **NOTE:** If this script is not being run in the root of the repository, use the `localRepoRoot` argument
 * @param {string} localRepoRoot=. - Relative path to the root of the repository. Required for source code links if this script is not being run in the repo root
 */
module.exports = {
    dest: {
        alias: 'o',
        type: 'string',
        coerce: resolvePath,
        default: 'dest',
    },
    force: {
        alias: 'f',
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
    reactDocs: {
        type: 'array',
        description:
            'One or more paths or globs to package entrypoint(s) to parse with React Docgen; usually `index.js` file(s)',
        normalize: false,
    },
    reactDocsOutputFile: {
        type: 'string',
        description:
            'The output path, relative to dest, for the markdown file generated from React Docgen docs',
        default: 'react-api.md',
    },
    reactDocsLinkSource: {
        type: 'boolean',
        description:
            'Add links to component source files according to the repository field in package.json',
        default: 'false',
    },
    localRepoRoot: {
        type: 'string',
        description:
            'Relative path to the root of the repository. Required for source code links if this script is not being run in the repo root',
        default: '.',
    },
}
