import {Command, flags} from '@oclif/command'

import {getHelpPlugin} from '..'

export default class HelpCommand extends Command {
  static description = 'display help for <%= config.bin %>'

  static flags = {
    all: flags.boolean({description: 'see all commands in CLI'}),
  }

  static args = [
    {name: 'command', required: false, description: 'command to show help for'},
  ]

  static strict = false

  async run() {
    const {flags, argv} = this.parse(HelpCommand)
    const Help = getHelpPlugin(this.config)
    const help = new Help(this.config, {all: flags.all})
    help.showHelp(argv)
  }
}
