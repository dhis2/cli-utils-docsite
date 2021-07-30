const path = require('path')
const { reporter } = require('@dhis2/cli-helpers-engine')
const fs = require('fs-extra')
const glob = require('glob')
const reactDocgen = require('react-docgen')
const getHTMLPropTable = require('./prop-table')

/**
 * Parses a React Docgen docs object and makes nice-looking markdown.
 * @param {Object} docgenDocs - a docs object that is the result of React Docgen parsing a file
 * @returns {string} Markdown describing the component that produced the docs object
 */
function getMarkdownFromDocgen(docgenDocs) {
    // Component name (with link?) [obj.displayName]
    // Optional filepath [obj.filepath] - added in rdParseFile() above
    // Component description [obj.description]
    // Proptypes [obj.props] - object keyed with prop names (see more below)
    // Methods? [obj.methods] - functions within the component that use /** @public */
    // Composes? (link to composed element) [obj.composes]
    const displayName = `### ${docgenDocs.displayName}`
    const filepath = `#### ${docgenDocs.filepath}`
    const composes = docgenDocs.composes
        ? `Composes ${docgenDocs.composes.join(', ')}`
        : null

    const propTable = docgenDocs.props
        ? getHTMLPropTable(docgenDocs.props)
        : '*No props detected for this component.*'

    const componentDocs = [
        displayName,
        filepath,
        docgenDocs.description,
        composes,
        propTable,
    ]
        .filter(e => !!e)
        .join('\n\n')
    return componentDocs
}

/**
 * Uses React Docgen to parse component APIs from a file.
 * @param {string} filepath - Path to file to parse
 * @returns {Array | undefined} An array of component docs objects or undefined if no components are found
 */
async function rdParseFile(filepath) {
    // exclude stories and tests and styles; include js|jsx|tsx
    const validFilePattern = /(?<!test|style|stories|e2e)\.[t|j]sx?$/
    if (!validFilePattern.test(filepath)) {
        return
    }

    const fileData = await fs.readFile(filepath)
    reporter.debug(`Parsing file ${filepath} with react-docgen`)

    try {
        const parsedInfos = reactDocgen.parse(
            fileData,
            reactDocgen.resolver.findAllExportedComponentDefinitions
        )
        return parsedInfos.map(info => ({ ...info, filepath }))
    } catch (err) {
        // If a file doesn't have any react components, the parse function
        // throws a 'No suitable component definition found' error, which can
        // be ignored
        const ignoreMsg = /No suitable component definition found/
        if (!ignoreMsg.test(err.message)) {
            reporter.error(`Error parsing ${filepath}`)
            throw err
        }
    }
}

/**
 * Get React docs from files matching input paths/globs and output them to a
 * file in the `dest` directory.
 * @param {string[]} inputGlobs An array of paths/globs to parse for React docs
 * @param {string} outputPath A path, relative to `dest`, where the resulting markdown will be output
 * @returns {Promise}
 */
function renderReactDocs(
    inputGlobs = ['**/src'],
    outputPath = './react-api.md'
) {
    const inputGlobsArray = Array.isArray(inputGlobs)
        ? inputGlobs
        : [inputGlobs]
    // Some file filtering added in globs here to increase performance
    const globs = inputGlobsArray.map(inputGlob =>
        fs.statSync(inputGlob).isDirectory()
            ? path.join(inputGlob, '/**/!(*.*).{js,jsx,tsx}')
            : inputGlob
    )

    // Process files in globs in parallel
    return Promise.all(
        globs.map(thisGlob => {
            return new Promise((resolve, reject) => {
                // Get filenames that match glob
                glob(thisGlob, (err, matches) =>
                    err ? reject(err) : resolve(matches)
                )
            }).then(matches => {
                // Get docgen info in parallel & process into markdown
                return Promise.all(
                    matches.map(filepath =>
                        rdParseFile(filepath).then(docgenInfo => {
                            return docgenInfo
                                ? docgenInfo.map(getMarkdownFromDocgen)
                                : null
                        })
                    )
                )
            })
        })
    ).then(mdData => {
        // mdData now has nested arrays with some undefined entries
        const markdown = mdData
            .flat(Infinity)
            .filter(e => !!e)
            .join('\n\n')
        if (markdown.length) {
            return fs.writeFile(outputPath, markdown)
        } else {
            reporter.debug('No react docs found')
        }
    })
}

module.exports = renderReactDocs