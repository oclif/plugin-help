import {expect, test} from '@oclif/test'

const VERSION = require('../../package.json').version
const UA = `@oclif/plugin-help/${VERSION} ${process.platform}-${process.arch} node-${process.version}`

describe('help command', () => {
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
  --include-nested, -i  include all nested commands in the output

`)
  })

  test
  .stdout()
  .command(['help'])
  .it('shows root help', ctx => {
    expect(ctx.stdout).to.equal(`standard help for oclif

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]

COMMANDS
  help  display help for oclif

`)
  })
})
