import {expect, test as base} from '@anycli/test'
import stripAnsi = require('strip-ansi')

global.columns = 80
import Help from '../src'

const test = base
.loadEngine()
.add('help', ctx => new Help(ctx.engine.config))
.register('rootHelp', () => ({
  run(ctx: {help: Help, commandHelp: string, expectation: string}) {
    let help = ctx.help.root()
    ctx.commandHelp = stripAnsi(help).split('\n').map(s => s.trimRight()).join('\n')
  }
}))

describe('root help', () => {
  test
  .rootHelp()
  .it(ctx => expect(ctx.commandHelp).to.equal(`standard help for anycli

USAGE
  $ anycli [COMMAND]

DESCRIPTION
  standard help for anycli

COMMANDS
  commands
  help               display help for anycli
  plugins
  plugins:install
  plugins:uninstall
  version`))
})
