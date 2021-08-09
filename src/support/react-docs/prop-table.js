const { HyperScript } = require('hyperscript-html')
const marked = require('marked')

const h = HyperScript({ prettyPrint: false })

const isMultiline = str => /\n/.test(str)

/* (Not JSDoc so it doesn't appear in docsite)
 * Takes a string of some code that will be formatted appropriately as a
 * single-line or multi-line code block
 * @param {string} code
 * @returns {string} HTML output
 */
function formatCodeToHTML(code) {
    // for formatting consistency with the rest of the page, go to markdown
    // first, then parse markdown to HTML with the same parser as Docsify
    const codeMarkdown = isMultiline(code)
        ? '```js\n' + code + '\n```'
        : '`' + code + '`'
    return marked(codeMarkdown)
}

/*
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
            const useRaw =
                propType.raw.length < 20 && !isMultiline(propType.raw)
            return useRaw ? propType.raw : propType.name
        }
        case 'enum': {
            // 'oneOf': propType.value = [{ value: string, computed: bool }]
            return propType.value.map(({ value }) => value).join(' | ')
        }
        case 'union': {
            // 'oneOfType': propType.value = [propType, propType, ...]
            return propType.value.map(getPropTypeDescription).join(' | ')
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
            const propSubtype = getPropTypeDescription(propType.value)
            // test: complex subtypes have non-word characters in them
            const subtypeIsComplex = /\W/g.test(propSubtype)
            // wrap complex subtypes in [] or put [] after simple subtypes
            return subtypeIsComplex ? `[${propSubtype}]` : `${propSubtype}[]`
        }
        case 'objectOf': {
            return `{ [key]: ${getPropTypeDescription(propType.value)} }`
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

/*
 * @param {Array} propEntry A [key, value] entry of the `props` object of a React Docgen component docs object
 * @returns {string} An HTML props table row that documents the prop
 */
function mapPropEntryToHTMLPropTableRow([name, info]) {
    // See the props data structure:
    // https://github.com/reactjs/react-docgen#result-data-structure
    const {
        type,
        required,
        description,
        defaultValue,
        // tsType,
    } = info

    // Todo: get description from TS type
    // if (tsType) { ... }

    const propName = h('span.prop-table-name', [
        name,
        required
            ? h(
                  'span.prop-table-name-required',
                  {
                      title: 'Required',
                  },
                  '*'
              )
            : null,
    ])
    const propType = h('p', h('code', getPropTypeDescription(type)))
    // process prop description as markdown
    const propDescription = description ? marked(description) : ''
    const propDefault = defaultValue ? formatCodeToHTML(defaultValue.value) : ''

    const cells = [propName, propType, propDescription, propDefault]
    return h(
        'tr',
        cells.map(c => h('td', c))
    )
}

function getHTMLPropTable(docgenProps) {
    const propTableRows = Object.entries(docgenProps)
        .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
        .map(mapPropEntryToHTMLPropTableRow)

    return h('table', [
        h('thead', [
            h('tr', [
                h('th', 'Property'),
                h('th', 'Type'),
                h('th', 'Description'),
                h('th', 'Default'),
            ]),
        ]),
        h('tbody', propTableRows),
    ])
}

module.exports = getHTMLPropTable
