/* globals EditOnGithubPlugin */

const generatedPages = '{{{generatedPages}}}'.split(',')

console.log(generatedPages)
window.$docsify = {
    name: '{{{name}}}',
    repo: '{{{repo}}}',

    basePath: 'markdown',

    loadSidebar: true,
    loadNavbar: true,
    mergeNavbar: true,

    alias: {
        '/.*/_sidebar.md': '_sidebar.md',
        '/.*/_navbar.md': '_navbar.md',
    },
    maxLevel: 1,
    auto2top: true,
    externalLinkTarget: '_self',

    pagination: {
        crossChapter: true,
    },

    plugins: [
        function (hook) {
            hook.doneEach(function () {
                // Invoked each time after the data is fully loaded, no arguments,
                if (document.title !== '{{{name}}}') {
                    document.title += ' - {{{name}}}'
                }
            })
        },
        EditOnGithubPlugin.create(
            '{{{repo}}}/blob/master/{{{sourcedir}}}',
            undefined,
            (name) => {
                if (
                    generatedPages.find((page) =>
                        name.match(`\\/?${page}\\.md`)
                    )
                ) {
                    return null
                }
                return '&#x270E;&nbsp;&nbsp;Edit on GitHub'
            }
        ),
    ],
}
