import {expect, test} from '@anycli/test'

describe('help command', () => {
  test
  .stdout()
  .command(['help', 'help'])
  .it('shows help command help', ctx => {
     expect(ctx.stdout).to.equal(`display help for anycli

USAGE
  $ anycli help [COMMAND] [OPTIONS]

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
     expect(ctx.stdout).to.equal(`standard help for anycli

USAGE
  $ anycli [COMMAND]

COMMANDS
  help     display help for anycli
  plugins  list installed plugins

`)
  })
})
