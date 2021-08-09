/**
 * The `resolveExportDeclaration` util used in the custom resolver doesn't
 * handle exports using the syntax `export {Component} from './Component.js'`.
 *
 * This helper catches those exports and uses the FS importer to resolve them
 * to a component definition (NodePath).
 */

const { namedTypes: t } = require('ast-types')
const resolveToValue = require('react-docgen').utils.resolveToValue

module.exports = function resolveExportSpecifier(path, importer) {
    const parentPath = path.parent
    if (t.ExportSpecifier.check(parentPath.node)) {
        let exportName

        if (t.ImportDefaultSpecifier.check(parentPath.node)) {
            exportName = 'default'
        } else {
            exportName = parentPath.node.local.name
        }

        const resolvedPath = importer(parentPath.parentPath, exportName)

        if (resolvedPath) {
            return resolveToValue(resolvedPath, importer)
        }
    }

    return path
}
