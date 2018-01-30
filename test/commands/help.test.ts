import {expect, test} from '@dxcli/test'

describe('help command', () => {
  test
  .stdout()
  .command(['help', 'help'])
  .it('shows help command help', ctx => {
     expect(ctx.stdout).to.equal(`display help for dxcli

USAGE
  $ dxcli help [COMMAND]
`)
  })
})
