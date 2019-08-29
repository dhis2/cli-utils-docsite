const { reporter } = require('@dhis2/cli-helpers-engine')
const { installTemplate, walkDir } = require('@dhis2/cli-helpers-template')
const fs = require('fs-extra')
const path = require('path')
const frontMatter = require('front-matter')
const chokidar = require('chokidar')

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
        reporter.debug()
    } else {
        await fs.copyFile(srcPath, outPath)
    }
}

module.exports = ({ source, dest, getCache, changelog, changelogFile }) => {
    const cache = getCache()
    const outDir = path.resolve(dest)
    const sourceDir = path.resolve(source)
    const markdownDir = path.join(outDir, 'markdown')

    const processOnChanged = async p => {
        const outPath =
            path.relative(process.cwd(), p) === changelogFile
                ? path.join(markdownDir, path.relative(process.cwd(), p))
                : path.join(markdownDir, path.relative(sourceDir, p))
        await processDocFile(p, outPath)
    }
    const processOnDeleted = async p => {
        const outPath =
            path.relative(process.cwd(), p) === changelogFile
                ? path.join(markdownDir, path.relative(process.cwd(), p))
                : path.join(markdownDir, path.relative(sourceDir, p))
        await fs.unlink(outPath)
    }

    return {
        initialize: async ({ data, force }) => {
            await fs.emptyDir(outDir)

            await installTemplate(templateDir, outDir, data)

            await localify({
                filePath: path.join(outDir, 'index.html'),
                assetsDir: path.join(outDir, 'assets'),
                cache,
                force,
            })
        },

        build: async () => {
            if (fs.existsSync(sourceDir)) {
                await walkDir(sourceDir, processOnChanged)
            }

            if (changelog && fs.existsSync(changelogFile)) {
                await fs.copyFile(
                    changelogFile,
                    path.join(markdownDir, 'CHANGELOG.md')
                )
            }
        },

        watch: () => {
            const watcher = chokidar
                .watch(`${source}/**`, {
                    ignoreInitial: true,
                })
                .on('addDir', p => fs.ensureDirSync(p))
                .on('add', processOnChanged)
                .on('change', processOnChanged)
                .on('unlink', processOnDeleted)
                .on('unlinkDir', processOnDeleted)

            if (changelog) {
                watcher.add(changelogFile)
            }
        },
    }
}
