const { reporter, chalk } = require('@dhis2/cli-helpers-engine')
const jsdoc2md = require('jsdoc-to-markdown')
const fs = require('fs-extra')
const path = require('path')

const render = async (source, dest) => {
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
    const markdown = await jsdoc2md.render({
        files,
        'heading-depth': 2,
        'example-lang': 'jsx',
        'param-format': 'code',
        'global-index-format': 'list',
    })

    await fs.writeFile(dest, markdown)
}

module.exports.render = render
