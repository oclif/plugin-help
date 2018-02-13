import {expect, test as base} from '@oclif/test'
import stripAnsi = require('strip-ansi')

global.columns = 80
import Help from '../src'

const test = base
.loadConfig()
.add('help', ctx => new Help(ctx.config))
.register('rootHelp', () => ({
  run(ctx: {help: Help, commandHelp: string, expectation: string}) {
    let help = ctx.help.root()
    if (process.env.TEST_OUTPUT === '1') {
      // tslint:disable-next-line
      console.log(help)
    }
    ctx.commandHelp = stripAnsi(help).split('\n').map(s => s.trimRight()).join('\n')
  }
}))

describe('root help', () => {
  test
  .rootHelp()
  .it(ctx => expect(ctx.commandHelp).to.equal(`standard help for oclif

USAGE
  $ oclif [COMMAND]`))
})
