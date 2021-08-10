/**
 * This is is a custom resolver for React Docgen. Resolvers receive an AST
 * from a parsed file and return an array NodePaths that correspond to
 * component definitions.
 *
 * React Docgen provides an optional `findAllExportedComponentDefinitions`
 * resolver, which can handle some exported components since the 6.0.0-alpha
 * version of docgen, but doesn't support the `export { Component } from './Component.js'`
 * export syntax. This custom one uses the same logic as the built-in one, and
 * adds support for that export syntax.
 */

const { namedTypes: t, visit } = require('ast-types')
const reactDocgen = require('react-docgen')
const resolveExportSpecifier = require('./resolve-export-specifier.js')
const resolveHOC = require('./resolveHOC.js')

const {
    isExportsOrModuleAssignment,
    isReactComponentClass,
    isReactCreateClassCall,
    isReactForwardRefCall,
    isStatelessComponent,
    normalizeClassDefinition,
    resolveExportDeclaration,
    resolveToValue,
    // resolveHOC, // not exported from library; copied locally
} = reactDocgen.utils

function ignore() {
    return false
}

function isComponentDefinition(path, importer) {
    return (
        isReactCreateClassCall(path, importer) ||
        isReactComponentClass(path, importer) ||
        isStatelessComponent(path, importer) ||
        isReactForwardRefCall(path, importer)
    )
}

function resolveDefinition(definition, importer) {
    if (isReactCreateClassCall(definition, importer)) {
        // return argument
        const resolvedPath = resolveToValue(
            definition.get('arguments', 0),
            importer
        )
        if (t.ObjectExpression.check(resolvedPath.node)) {
            return resolvedPath
        }
    } else if (isReactComponentClass(definition, importer)) {
        normalizeClassDefinition(definition)
        return definition
    } else if (
        isStatelessComponent(definition, importer) ||
        isReactForwardRefCall(definition, importer)
    ) {
        return definition
    }
    return null
}

function findExportedComponentDefinitionsUsingImporter(ast, parser, importer) {
    const components = []
    function exportDeclaration(path) {
        const definitions = resolveExportDeclaration(path, importer)
            // resolve export specifiers the above function missed:
            .map(path => resolveExportSpecifier(path, importer))
            .reduce((acc, definition) => {
                if (isComponentDefinition(definition, importer)) {
                    acc.push(definition)
                } else {
                    const resolved = resolveToValue(
                        resolveHOC(definition, importer),
                        importer
                    )
                    if (isComponentDefinition(resolved, importer)) {
                        acc.push(resolved)
                    }
                }
                return acc
            }, [])
            .map(definition => resolveDefinition(definition, importer))

        if (definitions.length === 0) {
            return false
        }
        definitions.forEach(definition => {
            if (definition && components.indexOf(definition) === -1) {
                components.push(definition)
            }
        })
        return false
    }

    visit(ast, {
        // Skip over these nodes without drilling down
        visitFunctionDeclaration: ignore,
        visitFunctionExpression: ignore,
        visitClassDeclaration: ignore,
        visitClassExpression: ignore,
        visitIfStatement: ignore,
        visitWithStatement: ignore,
        visitSwitchStatement: ignore,
        visitCatchClause: ignore,
        visitWhileStatement: ignore,
        visitDoWhileStatement: ignore,
        visitForStatement: ignore,
        visitForInStatement: ignore,

        // Handle ES6 exports
        visitExportDeclaration: exportDeclaration,
        visitExportNamedDeclaration: exportDeclaration,
        visitExportDefaultDeclaration: exportDeclaration,
        // todo: handle ExportAll
        visitExportAllDeclaration: exportDeclaration,

        // Handle module.exports
        visitAssignmentExpression: function (path) {
            // Ignore anything that is not `exports.X = ...;` or
            // `module.exports = ...;`
            if (!isExportsOrModuleAssignment(path, importer)) {
                return false
            }
            // Resolve the value of the right hand side. It should resolve to a call
            // expression, something like React.createClass
            path = resolveToValue(path.get('right'), importer)
            if (!isComponentDefinition(path, importer)) {
                path = resolveToValue(resolveHOC(path, importer), importer)
                if (!isComponentDefinition(path, importer)) {
                    return false
                }
            }
            const definition = resolveDefinition(path, importer)
            if (definition && components.indexOf(definition) === -1) {
                components.push(definition)
            }
            return false
        },
    })

    return components
}

module.exports = findExportedComponentDefinitionsUsingImporter
