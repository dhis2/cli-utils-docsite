module.exports = {
    source: {
        type: 'string',
        default: 'docs',
    },
    dest: {
        alias: 'o',
        type: 'string',
        default: 'www',
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
}
