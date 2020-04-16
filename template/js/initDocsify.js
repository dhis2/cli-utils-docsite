/* globals EditOnGithubPlugin */
window.$docsify = {
    name: '{{{name}}}',
    repo: '{{{repo}}}',
    themeColor: '#2196f3',

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
    noCompileLinks: ['/demo/.*'],

    pagination: {
        crossChapter: true,
    },

    plugins: [
        EditOnGithubPlugin.create(
            '{{{repo}}}/blob/master/{{{sourcedir}}}',
            undefined,
            '&#x270E;&nbsp;&nbsp;Edit on GitHub'
        ),
    ],
}
