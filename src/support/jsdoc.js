const { reporter, chalk } = require('@dhis2/cli-helpers-engine')
const jsdoc2md = require('jsdoc-to-markdown')
const fs = require('fs-extra')
const path = require('path')

const render = async (source, dest, opts) => {
    let files = Array.isArray(source) ? source : [source]
    files = files.map(f =>
        fs.statSync(f).isDirectory() ? path.join(f, '/**/*') : f
    )

    reporter.debug(
        `[jsdoc] Rendering ${chalk.bold(files.length)} files to ${chalk.bold(
            dest
        )}`,
        files
    )

    const defaults = {
        files,
        'heading-depth': 2,
        'example-lang': 'jsx',
        'param-format': 'code',
        'global-index-format': 'list',
    }

    const markdown = await jsdoc2md.render({
        ...defaults,
        ...opts.jsdoc2md,
    })

    await fs.writeFile(dest, markdown)
}

module.exports.render = render
