const { namespace } = require('@dhis2/cli-helpers-engine')

module.exports = namespace('docsite', {
    description: 'Build and serve developer documentation websites',
    builder: yargs => yargs.commandDir('./commands'),
})
