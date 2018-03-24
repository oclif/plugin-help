import {expect, test} from '@oclif/test'

const VERSION = require('../../package.json').version
const UA = `@oclif/plugin-help/${VERSION} ${process.platform}-${process.arch} node-${process.version}`

describe('help command', () => {
  test
  .stdout()
  .command(['help', 'plugins'])
  .it('shows plugins command help', ctx => {
     expect(ctx.stdout).to.equal(`list installed plugins

USAGE
  $ oclif plugins

OPTIONS
  --core  show core plugins

EXAMPLE
  $ oclif plugins

COMMANDS
  plugins:install    installs a plugin into the CLI
  plugins:uninstall  removes a plugin from the CLI
  plugins:update     update installed plugins

`)
  })

  test
  .stdout()
  .command(['help', 'help'])
  .skip()
  .it('shows help command help', ctx => {
     expect(ctx.stdout).to.equal(`display help for oclif

USAGE
  $ oclif help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI

`)
  })

  test
  .stdout()
  .command(['help'])
  .it('shows root help', ctx => {
     expect(ctx.stdout).to.equal(`${UA}
standard help for oclif

USAGE
  $ oclif [COMMAND]

COMMANDS
  help     display help for oclif
  plugins  list installed plugins

`)
  })
})
