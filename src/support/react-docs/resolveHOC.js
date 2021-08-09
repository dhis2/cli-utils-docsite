/**
 * This is a React Docgen util that is probably supposed to be exported from
 * the library like the other utils, but is not (probably unintentionally).
 *
 * It's copied here to complete the custom resolver.
 */

const { namedTypes: t } = require('ast-types')
const reactDocgen = require('react-docgen')

const { isReactCreateClassCall, isReactForwardRefCall, resolveToValue } =
    reactDocgen.utils

/*
 * If the path is a call expression, it recursively resolves to the
 * rightmost argument, stopping if it finds a React.createClass call expression
 *
 * Else the path itself is returned.
 */
module.exports = function resolveHOC(path, importer) {
    const node = path.node
    if (
        t.CallExpression.check(node) &&
        !isReactCreateClassCall(path, importer) &&
        !isReactForwardRefCall(path, importer)
    ) {
        if (node.arguments.length) {
            const inner = path.get('arguments', 0)

            // If the first argument is one of these types then the component might be the last argument
            // If there are all identifiers then we cannot figure out exactly and have to assume it is the first
            if (
                node.arguments.length > 1 &&
                (t.Literal.check(inner.node) ||
                    t.ObjectExpression.check(inner.node) ||
                    t.ArrayExpression.check(inner.node) ||
                    t.SpreadElement.check(inner.node))
            ) {
                return resolveHOC(
                    resolveToValue(
                        path.get('arguments', node.arguments.length - 1),
                        importer
                    ),
                    importer
                )
            }

            return resolveHOC(resolveToValue(inner, importer), importer)
        }
    }

    return path
}
