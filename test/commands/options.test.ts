import {expect, test} from '@oclif/test'

describe('help command', () => {
  test
  .stdout()
  .command(['options'])
  .skip()
  .it('shows help command help', ctx => {
     expect(ctx.stdout).to.equal(`display help for oclif

USAGE
  $ oclif help [COMMAND]

ARGUMENTS
  COMMAND  some options that should show. Can be one of: first, second

`)
  })
})
