import {Command as Base, flags} from '@anycli/command'
import * as Config from '@anycli/config'
import {expect, test as base} from '@anycli/test'
import stripAnsi = require('strip-ansi')

global.columns = 80
import Help from '../src'

class Command extends Base {
  async run() { return }
}

const test = base
.loadConfig()
.add('help', ctx => new Help(ctx.config))
.register('commandHelp', (command?: Config.Command.Class) => ({
  run(ctx: {help: Help, commandHelp: string, expectation: string}) {
    const cached = Config.Command.toCached(command!)
    let help = ctx.help.command(cached)
    if (process.env.TEST_OUTPUT === '1') {
      // tslint:disable-next-line
      console.log(help)
    }
    ctx.commandHelp = stripAnsi(help).split('\n').map(s => s.trimRight()).join('\n')
    ctx.expectation = 'has commandHelp'
  }
}))

describe('command help', () => {
  test
  .commandHelp(class extends Command {
    static id = 'apps:create'
    static aliases = ['app:init', 'create']
    static description = `first line
multiline help`
    static args = [{name: 'app_name', description: 'app to use'}]
    static flags = {
      app: flags.string({char: 'a', hidden: true}),
      foo: flags.string({char: 'f', description: 'foobar'.repeat(18)}),
      force: flags.boolean({description: 'force  it '.repeat(15)}),
      ss: flags.boolean({description: 'newliney\n'.repeat(4)}),
      remote: flags.string({char: 'r'}),
    }})
  .it('shows lots of output', ctx => expect(ctx.commandHelp).to.equal(`first line

USAGE
  $ anycli apps:create [APP_NAME] [OPTIONS]

ARGUMENTS
  APP_NAME  app to use

OPTIONS
  -f, --foo=foo        foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoo
                       barfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobar

  -r, --remote=remote

  --force              force  it force  it force  it force  it force  it force
                       it force  it force  it force  it force  it force  it
                       force  it force  it force  it force  it

  --ss                 newliney
                       newliney
                       newliney
                       newliney

DESCRIPTION
  multiline help

ALIASES
  $ anycli app:init
  $ anycli create`))

  test
  .commandHelp(class extends Command {
    static id = 'apps:create'
    static description = 'description of apps:create'
    static aliases = ['app:init', 'create']
    static args = [{name: 'app_name', description: 'app to use'}]
    static flags = {
      app: flags.string({char: 'a', hidden: true}),
      foo: flags.string({char: 'f', description: 'foobar'.repeat(20)}),
      force: flags.boolean({description: 'force  it '.repeat(29)}),
      ss: flags.boolean({description: 'newliney\n'.repeat(5)}),
      remote: flags.string({char: 'r'}),
    }})
  .it('shows alternate output when many lines', ctx => expect(ctx.commandHelp).to.equal(`description of apps:create

USAGE
  $ anycli apps:create [APP_NAME] [OPTIONS]

ARGUMENTS
  APP_NAME  app to use

OPTIONS
  -f, --foo=foo
      foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoob
      arfoobarfoobarfoobarfoobarfoobarfoobarfoobar

  -r, --remote=remote

  --force
      force  it force  it force  it force  it force  it force  it force  it force
      it force  it force  it force  it force  it force  it force  it force  it
      force  it force  it force  it force  it force  it force  it force  it force
      it force  it force  it force  it force  it force  it force  it

  --ss
      newliney
      newliney
      newliney
      newliney
      newliney

ALIASES
  $ anycli app:init
  $ anycli create`))

  test
  .commandHelp(class extends Command {
    static id = 'apps:create'
    static description = 'description of apps:create'
    static aliases = ['app:init', 'create']
    static args = [{name: 'app_name', description: 'app to use'}]
    static flags = {
      force: flags.boolean({description: 'forces'}),
    }})
  .it('outputs with description', ctx => expect(ctx.commandHelp).to.equal(`description of apps:create

USAGE
  $ anycli apps:create [APP_NAME] [OPTIONS]

ARGUMENTS
  APP_NAME  app to use

OPTIONS
  --force  forces

ALIASES
  $ anycli app:init
  $ anycli create`))

  test
  .commandHelp(class extends Command {
    static id = 'apps:create'
    static flags = {
      myenum: flags.enum({options: ['a', 'b', 'c']}),
    }})
  .it('outputs with description', ctx => expect(ctx.commandHelp).to.equal(`USAGE
  $ anycli apps:create [OPTIONS]

OPTIONS
  --myenum=(a|b|c)`))

  test
  .commandHelp(class extends Command {
    static id = 'apps:create'
    static args = [
      {name: 'arg1', default: '.'},
      {name: 'arg2', default: '.', description: 'arg2 desc'},
      {name: 'arg3', description: 'arg3 desc'},
    ]
    static flags = {
      flag1: flags.string({default: '.'}),
      flag2: flags.string({default: '.', description: 'flag2 desc'}),
      flag3: flags.string({description: 'flag3 desc'}),
    }
  })
  .it('outputs with default options', ctx => expect(ctx.commandHelp).to.equal(`USAGE
  $ anycli apps:create [ARG1] [ARG2] [ARG3] [OPTIONS]

ARGUMENTS
  ARG1  [default: .]
  ARG2  [default: .] arg2 desc
  ARG3  arg3 desc

OPTIONS
  --flag1=flag1  [default: .]
  --flag2=flag2  [default: .] flag2 desc
  --flag3=flag3  flag3 desc`))

  // class AppsCreate3 extends Command {
  //   static id = 'apps:create'
  //   static flags = {
  //     app: flags.string({char: 'a', hidden: true}),
  //     foo: flags.string({char: 'f', description: 'foobar'}),
  //     force: flags.boolean({description: 'force it'}),
  //     remote: flags.string({char: 'r'}),
  //   }
  // }
  // test('has just flags', () => {
  //   expect(help.command(AppsCreate3)).toEqual(`Usage: cli-engine apps:create [flags]

// Flags:
 // -f, --foo FOO        foobar
 // -r, --remote REMOTE
 // --force              force it
// `)
  // })

  // test('has flags + description', () => {
  //   class CMD extends Command {
  //     static id = 'apps:create'
  //     static description = 'description of apps:create'
  //     static flags = {
  //       app: flags.string({char: 'a', hidden: true}),
  //       foo: flags.string({char: 'f', description: 'foobar'}),
  //       force: flags.boolean({description: 'force it'}),
  //       remote: flags.string({char: 'r'}),
  //     }
  //   }
  //   expect(help.command(CMD)).toEqual(`Usage: cli-engine apps:create [flags]

// description of apps:create

// Flags:
 // -f, --foo FOO        foobar
 // -r, --remote REMOTE
 // --force              force it
// `)
  // })

  // class AppsCreate1 extends Command {
  //   static id = 'apps:create'
  //   static help = 'description of apps:create'
  //   static flags = {
  //     app: flags.string({char: 'a', hidden: true}),
  //     foo: flags.string({char: 'f', description: 'foobar'}),
  //     force: flags.boolean({description: 'force it'}),
  //     remote: flags.string({char: 'r'}),
  //   }
  // }
  // test('has description + help', () => {
  //   expect(help.command(AppsCreate1)).toEqual(`Usage: cli-engine apps:create [flags]

// Flags:
 // -f, --foo FOO        foobar
 // -r, --remote REMOTE
 // --force              force it

// description of apps:create
// `)
  // })

  // class AppsCreate2 extends Command {
  //   static id = 'apps:create'
  //   static description = 'description of apps:create'
  //   static args = [{name: 'app_name', description: 'app to use'}]
  // }

  // test('has description + args', () => {
  //   expect(help.command(AppsCreate2)).toEqual(`Usage: cli-engine apps:create [APP_NAME]

// description of apps:create

// APP_NAME  app to use
// `)
  // })

  // class CMD extends Command {
  //   static id = 'apps:create2'
  //   static description = 'description of apps:create2'
  //   static args = [{name: 'app_name', description: 'app to use'}]
  //   static aliases = ['foo', 'bar']
  // }
  // test('has aliases', () => {
  //   expect(help.command(CMD)).toEqual(`Usage: cli-engine apps:create2 [APP_NAME]

// description of apps:create2

// Aliases:
  // $ cli-engine foo
  // $ cli-engine bar

// APP_NAME  app to use
// `)
  // })
})

// describe('command()', () => {
  // test('has command help', () => {
  //   expect(help.commandLine(AppsCreate)).toEqual(['apps:create [APP_NAME]', 'description of apps:create'])
  // })
// })
