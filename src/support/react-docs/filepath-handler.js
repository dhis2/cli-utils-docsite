const { namedTypes: t } = require('ast-types')

// The React Docgen parser adds an 'options' object to the root Program node
// for each component's NodePath, which has a 'filename' property (which is
// actually a filepath). This function retrieves the 'options' object from
// a component's root Program node
function getOptions(path) {
    while (!t.Program.check(path.node)) {
        path = path.parentPath
    }

    return path.node.options || {}
}

// Receives a documentation object and a NodePath for a component definition,
// and retrieves component's filepath and adds it to the documentation object
function filepathHandler(documentation, path) {
    const options = getOptions(path)
    if (options.filename) {
        documentation.set('filepath', options.filename)
    }
}

module.exports = filepathHandler
