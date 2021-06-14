const path = require('path')
const { reporter, chalk } = require('@dhis2/cli-helpers-engine')
const liveServer = require('live-server')
const commonOptions = require('../support/commonOptions')
const DocsEngine = require('../support/docs')

/**
 * @name serve [source] [options]
 * @kind command
 * @description Serve the docsite and watch for changes.
 * @param {string} source=./docs - Path to documentation source files
 * @param **options** - Accepts all **Common Options** plus the following:
 * @param {number} port=3000 - The port on which to serve the docsite
 * @param {boolean} open=true - If true, open the served docsite in a new browser window
 * @example @lang sh
 * > d2 utils docsite serve ./docs -o ./dist --port 3001
 */
const handler = async ({ port, open, force, ...options }) => {
    reporter.debug('Options', options)
    const docs = DocsEngine(options)

    reporter.info('Initializing docsite...')
    await docs.initialize({ force })

    reporter.info('Building...')
    await docs.build()

    await liveServer.start({
        root: options.dest,
        wait: 300,
        port,
        open,
        logLevel: 0,
    })
    reporter.info(
        chalk.green(
            `Serving docsite at ${chalk.bold(`http://localhost:${port}`)}`
        )
    )
    reporter.info('Watching for changes...')
    docs.watch()
}

module.exports = {
    command: 'serve [source]',
    desc: 'Serve documentation',
    aliases: 's',
    builder: {
        source: {
            type: 'string',
            coerce: p => path.resolve(p),
            default: 'docs',
        },
        ...commonOptions,
        port: {
            type: 'number',
            default: 3000,
        },
        open: {
            type: 'boolean',
            default: true,
        },
    },
    handler,
}
