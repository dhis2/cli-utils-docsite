const marked = require('marked')

const wrapInHTMLTag = (content, tag) => `<${tag}>${content}</${tag}>`
const isMultiline = str => /\n/.test(str)

/**
 * Text parsed by `marked` is wrapped in `p` tags by default, which adds
 * substantial height to each table row. `marked.parseInline` omits `p` tags
 * if possible, which will make tables more compact
 * @param {string} markdown
 * @returns {string} HTML generated from markdown
 */
function parseInlineOrMultiline(markdown) {
    return isMultiline(markdown)
        ? marked(markdown)
        : marked.parseInline(markdown)
}

/**
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
    return parseInlineOrMultiline(codeMarkdown)
}

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

    const propName = formatCodeToHTML(name)
    // todo: needs improving
    const propType = formatCodeToHTML(getPropTypeDescription(type))
    // process prop description as markdown
    const propDescription = description
        ? parseInlineOrMultiline(description)
        : ''
    const propDefault = defaultValue ? formatCodeToHTML(defaultValue.value) : ''
    const propRequired = required || ''

    const tableCells = [
        propName,
        propType,
        propDescription,
        propDefault,
        propRequired,
    ]
        .map(cellContents => wrapInHTMLTag(cellContents, 'td'))
        .join('')

    return wrapInHTMLTag(tableCells, 'tr')
}

/**
 * @param {string} rows - `<tr>` elements that will comprise the table body
 * @returns {string} A complete HTML prop table
 */
function addRowsToPropTableTemplate(rows) {
    return `<table>
    <thead>
        <tr>
            <th>prop</th>
            <th>type</th>
            <th>description</th>
            <th>default</th>
            <th>required</th>
        </tr>
    </thead>
    <tbody>
        ${rows}
    </tbody>
</table>`
}

function getHTMLPropTable(docgenProps) {
    const propTableRows = Object.entries(docgenProps)
        .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
        .map(mapPropEntryToHTMLPropTableRow)
        .join('\n')
    return addRowsToPropTableTemplate(propTableRows)
}

module.exports = getHTMLPropTable
