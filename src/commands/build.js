const DocsEngine = require('../support/docs')
const commonOptions = require('../support/commonOptions')

const data = {
    name: 'test',
    title: 'This is a Test',
    description: 'This is a longer description of Test',
    repo: 'my/repo',
}

const handler = async ({ force, ...options }) => {
    const docs = DocsEngine(options)

    await docs.initialize({
        data: {
            ...data,
            basePath: options.dest,
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
