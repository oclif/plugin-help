import {Args, Command, Flags, Help} from '@oclif/core'

export default class HelpCommand extends Command {
  static description = 'Display help for <%= config.bin %>.'

  static flags = {
    'nested-commands': Flags.boolean({
      description: 'Include all nested commands in the output.',
      char: 'n',
    }),
  }

  static args = {command: Args.string({name: 'command', required: false, description: 'Command to show help for.'})}

  static strict = false

  async run(): Promise<void> {
    const {flags, argv} = await this.parse(HelpCommand)
    const help = new Help(this.config, {all: flags['nested-commands']})
    const argvStr = argv.map(arg => String(arg))
    await help.showHelp(argvStr)
  }
}
