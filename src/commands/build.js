const DocsEngine = require('../support/docs')
const commonOptions = require('../support/commonOptions')

const data = {
    name: null,
    title: null,
    description: null,
    repo: 'my/repo',
}

const handler = async ({ force, ...options }) => {
    const docs = DocsEngine(options)

    await docs.initialize({
        data: {
            ...answers,
            sourcedir: source,
        },
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
