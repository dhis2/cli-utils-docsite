const { reporter } = require('@dhis2/cli-helpers-engine')
const DocsEngine = require('../support/docs')
const commonOptions = require('../support/commonOptions')

const handler = async ({ force, ...options }) => {
    reporter.debug('Options', options)
    const docs = DocsEngine(options)

    await docs.initialize({
        force,
    })
    await docs.build()
}

module.exports = {
    command: 'build [source]',
    desc: 'Build a production version of the documentation site',
    aliases: 'b',
    builder: {
        ...commonOptions,
    },
    handler,
}
