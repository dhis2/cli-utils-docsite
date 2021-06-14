const path = require('path')
const { reporter } = require('@dhis2/cli-helpers-engine')
const commonOptions = require('../support/commonOptions')
const DocsEngine = require('../support/docs')

/**
 * @name build [source] [options]
 * @kind command
 * @description Build the docsite.
 * @param {string} source=./docs - Path to documentation source files
 * @param **options** - Accepts all **Common Options** plus the following:
 * @param {boolean} watch=false - If true, watch for changes
 * @example @lang sh
 * > d2 utils docsite build ./docs -o ./dist --jsdoc src/ --watch
 */
const handler = async ({ force, watch, ...options }) => {
    reporter.debug('Options', options)
    const docs = DocsEngine(options)

    reporter.info('Initializing docsite...')
    await docs.initialize({
        force,
    })
    reporter.info('Building...')
    await docs.build()

    if (watch) {
        reporter.info('Watching for changes...')
        docs.watch()
    }
}

module.exports = {
    command: 'build [source]',
    desc: 'Build a production version of the documentation site',
    aliases: 'b',
    builder: {
        source: {
            type: 'string',
            coerce: p => path.resolve(p),
            default: 'docs',
        },
        ...commonOptions,
        watch: {
            type: 'boolean',
            description: 'Watch for source file changes and re-build',
            default: false,
        },
    },
    handler,
}
