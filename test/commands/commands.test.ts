import {expect, test} from '@oclif/test'

const command = 'commands'

describe(command, () => {
  test
  .stdout()
  .command([command])
  .it(ctx => {
    expect(ctx.stdout).to.equal(`commands
help
plugins
plugins:install
plugins:uninstall
plugins:update
`)
  })
})
