const { reporter } = require('@dhis2/cli-helpers-engine')
const { walkDir } = require('@dhis2/cli-helpers-template')
const fs = require('fs-extra')
const reactDocgen = require('react-docgen')

async function rdParseFile(filepath) {
    // exclude stories and tests and styles; include js|jsx|tsx
    const validFilePattern = /(?<!test|style|stories)\.[t|j]sx?$/
    if (!validFilePattern.test(filepath)) {
        return
    }

    const fileData = await fs.readFile(filepath)
    reporter.debug(`Parsing file ${filepath} with react-docgen`)

    try {
        const parsedInfo = reactDocgen.parse(fileData)
        return { filepath, ...parsedInfo }
    } catch (err) {
        // If a file doesn't have any react components, the parse function
        // throws a 'No suitable component definition found' error, which can
        // be ignored
        const ignoreMsg = /No suitable component definition found/
        if (!ignoreMsg.test(err.message)) {
            throw err
        }
    }
}

const propTableHeader = `| prop | type | description | default | required |
| ---- | ---- | ----------- | ------- | -------- |`

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

    let propTable = null
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
            // '&#124;' makes a pipe character (|) in the markdown table
            return propType.value.map(({ value }) => value).join(' &#124; ')
        }
        case 'union': {
            // 'oneOfType': propType.value = [propType, propType, ...]
            return propType.value.map(getPropTypeDescription).join(' &#124; ')
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

// function getTsPropTypeDescription(tsType) {}

function getPropDefaultValue(defaultValue) {
    return defaultValue ? '`' + defaultValue.value.replace(/\n/g, '') + '`' : ''
}

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

function processReactDocgen(rootDir = './src', outputPath = './react-api.md') {
    return (
        walkDir(rootDir, rdParseFile)
            // Result is a nested array with some undefined elements
            .then(arr =>
                arr
                    .flat(Infinity)
                    .filter(e => e !== undefined)
                    .map(getMarkdownFromDocgen)
                    .join('\n\n')
            )
            .then(mdData => fs.writeFile(outputPath, mdData))
    )
}

module.exports = processReactDocgen
