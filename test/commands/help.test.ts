import {expect, test} from '@anycli/test'

describe('help command', () => {
  test
  .stdout()
  .command(['help', 'help'])
  .it('shows help command help', ctx => {
     expect(ctx.stdout).to.equal(`display help for anycli

USAGE
  $ anycli help [COMMAND] [OPTIONS]

OPTIONS
  --all                    see all commands in CLI
  --format=(markdown|man)  output in a different format
`)
  })
})
