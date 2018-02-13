import {expect, test} from '@oclif/test'

describe('help command', () => {
  test
  .stdout()
  .command(['help', 'help'])
  .it('shows help command help', ctx => {
     expect(ctx.stdout).to.equal(`display help for oclif

USAGE
  $ oclif help [COMMAND] [OPTIONS]

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
     expect(ctx.stdout).to.equal(`standard help for oclif

USAGE
  $ oclif [COMMAND]

COMMANDS
  help     display help for oclif
  plugins  list installed plugins

`)
  })
})
