import {expect, test as base} from '@oclif/test'
import stripAnsi = require('strip-ansi')

const g: any = global
g.columns = 80
import Help from '../src'

const VERSION = require('../package.json').version
const UA = `@oclif/plugin-help/${VERSION} ${process.platform}-${process.arch} node-${process.version}`

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

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]`))
})
