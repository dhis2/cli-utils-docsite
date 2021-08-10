const path = require('path')
const { reporter } = require('@dhis2/cli-helpers-engine')
const fs = require('fs-extra')
const glob = require('glob')
const reactDocgen = require('react-docgen')
const urlJoin = require('url-join')
const findExportedComponentDefinitionsUsingImporter = require('./custom-resolver')
const filepathHandler = require('./filepath-handler')
const getHTMLPropTable = require('./prop-table')

/*
 * Parses a React Docgen docs object and makes nice-looking markdown.
 * @param {Object} docgenDocs - a docs object that is the result of React Docgen parsing a file
 * @param {Object} options - { linkSource: boolean, remoteRepoURL: string, localRepoRoot: string }
 * @returns {string} Markdown describing the component that produced the docs object
 */
function getMarkdownFromDocgen(docgenDocs, options) {
    const { linkSource, remoteRepoURL, localRepoRoot } = options

    // filepath [docgenDocs.filepath] - added by filepath handler
    const relativeFilepath = path.relative(localRepoRoot, docgenDocs.filepath)
    let sourceURL
    if (linkSource && remoteRepoURL) {
        // handles case where script is run in a different dir than repo root
        sourceURL = urlJoin(remoteRepoURL, relativeFilepath)
    }

    const displayName = `## ${docgenDocs.displayName}`
    const filepath = linkSource
        ? `[**${relativeFilepath}**](${sourceURL})`
        : `**${relativeFilepath}**`
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

/*
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

    const absoluteFilepath = path.resolve(process.cwd(), filepath)
    const fileData = await fs.readFile(absoluteFilepath)
    reporter.debug(`Parsing file ${absoluteFilepath} with react-docgen`)

    const { parse, defaultHandlers, importers } = reactDocgen
    try {
        const parsedInfos = parse(
            fileData,
            // Resolvers receive an AST and can return component definitions'
            // NodePaths to be parsed for documentation.
            // This custom resolver extends a built-in one by supporting more
            // syntaxes for exported components
            findExportedComponentDefinitionsUsingImporter,
            // Handlers receive a component definition's nodepath and can add data
            // to the component's resulting 'documentation' object.
            // The custom handler adds a 'filepath' property to the documentation
            [...defaultHandlers, filepathHandler],
            // These options enable handling of imported values, including both
            // imported props and components, by traversing imports
            { importer: importers.makeFsImporter(), filename: absoluteFilepath }
        )
        return parsedInfos
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

/* (Not a JSDoc so it doesnt appear in docsite)
 * Get React docs from files matching input paths/globs and output them to a
 * file in the `dest` directory.
 * @param {string[]} inputGlobs An array of paths/globs to parse for React docs
 * @param {string} outputPath A path, relative to `dest`, where the resulting markdown will be output
 * @param {Object} options
 * @param {boolean} options.linkSource - if true, will add links to source files
 * @param {string} options.remoteRepoUrl - URL base for GitHub source files; should end with '/tree/master'
 * @param {string} options.localRepoRoot - relative path to the repository locally
 * @returns {Promise}
 */
function renderReactDocs(
    inputGlobs = ['**/src'],
    outputPath = './react-api.md',
    options
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
                                ? docgenInfo.map(info =>
                                      getMarkdownFromDocgen(info, options)
                                  )
                                : null
                        })
                    )
                )
            })
        })
    ).then(mdData => {
        // mdData now has nested arrays with some undefined entries
        const componentsMarkdown = mdData
            .flat(Infinity)
            .filter(e => !!e)
            .join('\n\n')
        if (componentsMarkdown.length) {
            const markdown = `# React API\n\n${componentsMarkdown}`
            return fs.writeFile(outputPath, markdown)
        } else {
            reporter.debug('No react docs found')
        }
    })
}

module.exports = renderReactDocs
