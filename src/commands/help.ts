import {Command, Flags, Help} from '@oclif/core'

export default class HelpCommand extends Command {
  static description = 'display help for <%= config.bin %>'

  static flags = {
    'nested-commands': Flags.boolean({
      description: 'include all nested commands in the output',
      char: 'i',
    }),
  }

  static args = [
    {name: 'command', required: false, description: 'command to show help for'},
  ]

  static strict = false

  async run() {
    const {flags, argv} = await this.parse(HelpCommand)
    const help = new Help(this.config, {all: flags['nested-commands']})
    await help.showHelp(argv)
  }
}
