const { reporter } = require('@dhis2/cli-helpers-engine')
const { installTemplate, walkDir } = require('@dhis2/cli-helpers-template')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const frontMatter = require('front-matter')
const chokidar = require('chokidar')
const JSDocEngine = require('../support/jsdoc')

const { localify } = require('../support/localify')

const templateDir = path.join(__dirname, '../../template')

const processDocFile = async (srcPath, outPath) => {
    reporter.debug(`Processing doc file ${srcPath} => ${outPath}`)
    await fs.ensureDir(path.dirname(outPath))
    if (path.extname(srcPath) === '.md') {
        const content = (await fs.readFile(srcPath)).toString()
        const fm = frontMatter(content)

        // TODO: auto-generate the _sidebar from frontmatter

        await fs.writeFile(outPath, fm.body)
    } else {
        await fs.copyFile(srcPath, outPath)
    }
}

const parsePackageRepository = repository => {
    let repo
    if (!repository || typeof repository === 'string') {
        repo = repository
    } else {
        repo = repository.url
    }

    if (path.extname(repo) === '.git') {
        // TODO: support non-git repos?
        repo = repo.substr(0, repo.length - 4)
    }

    // TODO: Support non-root repository links (need to modify docsify)
    // if (repository.directory) {
    //     repo = path.join(repo, repository.directory)
    // }

    return repo
}

const loadData = ({ dataInput, configFile, packageJsonFile }) => {
    let configData, packageData

    reporter.debug('Manual template data', dataInput)

    try {
        const config = require(configFile)
        configData = {
            ...config,
            ...config.docsite,
        }
        reporter.debug(`Template data loaded from config file ${configFile}`)
    } catch (e) {
        reporter.debug(`Failed to load config file ${configFile}`)
    }

    try {
        const pkg = require(packageJsonFile)
        packageData = {
            name: pkg.name,
            description: pkg.description,
            version: pkg.version,
            repo: parsePackageRepository(pkg.repository),
            ...pkg.d2,
            ...(pkg.d2 && pkg.d2.docsite),
        }
        reporter.debug(
            `Template data loaded from package.json file ${packageJsonFile}`
        )
    } catch (e) {
        reporter.debug(`Failed to load package.json file ${packageJsonFile}`, e)
    }

    const data = {
        ...packageData,
        ...configData,
        ...dataInput,
    }

    if (!data.title) {
        data.title = data.name
    }

    reporter.debug('Final template data', data)
    return data
}

module.exports = ({
    source,
    dest,
    data: dataInput,
    configFile,
    getCache,
    changelog,
    changelogFile,
    jsdoc,
    jsdocOutputFile,
}) => {
    const cache = getCache()
    const markdownDir = path.join(dest, 'markdown')
    const jsdocOut = path.join(markdownDir, jsdocOutputFile)

    const data = loadData({
        dataInput,
        configFile,
        packageJsonFile: path.join(process.cwd(), 'package.json'),
    })
    data.sourcedir = data.sourcedir
        ? path.join(data.sourcedir, path.relative(process.cwd(), source))
        : path.relative(process.cwd(), source)

    const processOnChanged = async p => {
        const outPath =
            path.relative(process.cwd(), p) === changelogFile
                ? path.join(markdownDir, path.relative(process.cwd(), p))
                : path.join(markdownDir, path.relative(source, p))
        await processDocFile(p, outPath)
    }

    const processJSDoc = async () => {
        await JSDocEngine.render(jsdoc, jsdocOut)
    }

    const processOnDeleted = async p => {
        const outPath =
            path.relative(process.cwd(), p) === changelogFile
                ? path.join(markdownDir, path.relative(process.cwd(), p))
                : path.join(markdownDir, path.relative(source, p))
        await fs.unlink(outPath)
    }

    return {
        initialize: async ({ force }) => {
            await fs.emptyDir(dest)

            await installTemplate(templateDir, dest, data)

            await localify({
                filePath: path.join(dest, 'index.html'),
                assetsDir: path.join(dest, 'assets'),
                cache,
                force,
            })
        },

        build: async () => {
            if (fs.existsSync(source)) {
                await walkDir(source, processOnChanged)
            }

            if (changelog && fs.existsSync(changelogFile)) {
                await fs.copyFile(
                    changelogFile,
                    path.join(markdownDir, 'CHANGELOG.md')
                )
            }

            if (jsdoc && jsdoc.length) {
                processJSDoc()
            }
        },

        watch: () => {
            const docsWatcher = chokidar
                .watch(`${source}/**`, {
                    ignoreInitial: true,
                })
                .on('all', (e, p) =>
                    reporter.print(
                        'Change detected!',
                        chalk.dim(path.relative(process.cwd(), p))
                    )
                )
                .on('addDir', p => fs.ensureDirSync(p))
                .on('add', processOnChanged)
                .on('change', processOnChanged)
                .on('unlink', processOnDeleted)
                .on('unlinkDir', processOnDeleted)

            if (changelog) {
                docsWatcher.add(changelogFile)
            }

            chokidar
                .watch(jsdoc, {
                    ignoreInitial: true,
                })
                .on('all', async (e, p) => {
                    reporter.print(
                        'JSDoc change detected!',
                        chalk.dim(path.relative(process.cwd(), p))
                    )
                    await processJSDoc()
                })

            // TODO: Also watch config files
        },
    }
}
