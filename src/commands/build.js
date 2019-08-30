const { reporter } = require('@dhis2/cli-helpers-engine')
const DocsEngine = require('../support/docs')
const commonOptions = require('../support/commonOptions')

/**
 * @name build [source] [options]
 * @kind command
 * @description Build the docsite.
 * @param - Accepts all **Common Options** plus the following:
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
        ...commonOptions,
        watch: {
            type: 'boolean',
            description: 'Watch for source file changes and re-build',
            default: false,
        },
    },
    handler,
}
