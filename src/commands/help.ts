import {Command, flags} from '@anycli/command'

import Help from '..'

export default class HelpCommand extends Command {
  static title = 'display help for <%= config.bin %>'
  static flags = {
    all: flags.boolean({description: 'see all commands in CLI'}),
    format: flags.enum({description: 'output in a different format', options: ['markdown', 'man']}),
  }
  static args = [
    {name: 'command', required: false, description: 'command to show help for'}
  ]

  async run() {
    const {flags, argv} = this.parse(HelpCommand)
    const format = flags.format as any || 'screen'
    let help = new Help(this.config, {format})
    help.showHelp(argv)
  }
}
