const path = require('path')

const resolvePath = p => path.resolve(p)

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
}
