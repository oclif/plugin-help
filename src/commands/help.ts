import {Args, Command, Flags, Help} from '@oclif/core'

export default class HelpCommand extends Command {
  static args = {
    commands: Args.string({description: 'Command to show help for.', required: false}),
  }

  static description = 'Display help for <%= config.bin %>.'

  static flags = {
    'nested-commands': Flags.boolean({
      char: 'n',
      description: 'Include all nested commands in the output.',
    }),
  }

  static strict = false

  async run(): Promise<void> {
    const {argv, flags} = await this.parse(HelpCommand)
    const help = new Help(this.config, {all: flags['nested-commands']})
    await help.showHelp(argv as string[])
  }
}
