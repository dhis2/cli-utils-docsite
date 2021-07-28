const path = require('path')
const { reporter } = require('@dhis2/cli-helpers-engine')
const fs = require('fs-extra')
const glob = require('glob')
const reactDocgen = require('react-docgen')

/**
 * @param {Object} propType A `propType` object from a React Docgen component docs object
 * @returns {string} a string describing the type of that prop to put in a props table
 */
function getPropTypeDescription(propType) {
    // a prop with a default value but no type is null
    if (propType == null) {
        return null
    }
    switch (propType.name) {
        case 'custom': {
            // Custom prop types: functions, or defined elsewhere
            // If raw is short and lives on one line, use raw
            const useRaw = propType.raw.length < 50 && !/\n/.test(propType.raw)
            return useRaw ? propType.raw : propType.name
        }
        case 'enum': {
            // 'oneOf': propType.value = [{ value: string, computed: bool }]
            // pipe (|) needs an escaped '\' to appear in the markdown table
            return propType.value.map(({ value }) => value).join(' \\| ')
        }
        case 'union': {
            // 'oneOfType': propType.value = [propType, propType, ...]
            return propType.value.map(getPropTypeDescription).join(' \\| ')
        }
        case 'exact':
        case 'shape': {
            // recursively get property type descriptions
            const properties = Object.entries(propType.value).map(
                ([propertyName, type]) => {
                    const optional = type.required ? '' : '?'
                    const typeDescription = getPropTypeDescription(type)
                    return `${propertyName}${optional}: ${typeDescription}`
                }
            )
            return `{ ${properties.join(', ')} }`
        }
        case 'instanceOf': {
            return propType.value
        }
        case 'arrayOf': {
            // recursively get nested prop types
            return `arrayOf(${getPropTypeDescription(propType.value)})`
        }
        case 'objectOf': {
            return `objectOf(${getPropTypeDescription(propType.value)})`
        }
        default: {
            // any, array, bool, element, func, elementType, node, number,
            // object, string, symbol
            return propType.name
        }
    }
}

// todo
// function getTsPropTypeDescription(tsType) {}

/**
 * @param {Object | undefined} defaultValue A `defaultValue` object from React Docgen component docs object
 * @returns {string} a nice string to describe the default value in the props table
 */
function getPropDefaultValue(defaultValue) {
    return defaultValue ? '`' + defaultValue.value.replace(/\n/g, '') + '`' : ''
}

/**
 * @param {Array} param0 A [key, value] entry of the `props` object of a React Docgen component docs object
 * @returns {string} A markdown-notated props table row that documents the prop
 */
function mapPropEntryToPropTableRow([name, info]) {
    // See the props data structure:
    // https://github.com/reactjs/react-docgen#result-data-structure
    const {
        type,
        required,
        description,
        defaultValue,
        // tsType,
    } = info

    const propName = '`' + name + '`'
    // Todo: get description from TS type
    // if (tsType !== undefined) ...
    const propType = '`' + getPropTypeDescription(type) + '`'
    const propDefault = getPropDefaultValue(defaultValue)
    const propDescription = description || ''
    const propRequired = required || ''

    return `| ${propName} | ${propType} | ${propDescription} | ${propDefault} | ${propRequired} |`
}

const propTableHeader = `| prop | type | description | default | required |
| ---- | ---- | ----------- | ------- | -------- |`

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

    let propTable = '*No props detected for this component.*'
    if (docgenDocs.props) {
        const propTableRows = Object.entries(docgenDocs.props)
            .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
            .map(mapPropEntryToPropTableRow)
            .join('\n')
        propTable = [propTableHeader, propTableRows].join('\n')
    }

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
