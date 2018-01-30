import {expect, test} from '@dxcli/test'

const command = 'commands'

describe(command, () => {
  test
  .stdout()
  .command([command])
  .it(ctx => {
    expect(ctx.stdout).to.equal(`commands
commands
help
help
`)
  })
})
