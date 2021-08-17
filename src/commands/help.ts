import {Command, Flags, Help} from '@oclif/core'

export default class HelpCommand extends Command {
  static description = 'display help for <%= config.bin %>'

  static flags = {
    all: Flags.boolean({description: 'see all commands in CLI'}),
  }

  static args = [
    {name: 'command', required: false, description: 'command to show help for'},
  ]

  static strict = false

  async run() {
    const {flags, argv} = await this.parse(HelpCommand)
    const help = new Help(this.config, {all: flags.all})
    await help.showHelp(argv)
  }
}
