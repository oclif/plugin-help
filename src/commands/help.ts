import {Command, flags} from '@anycli/command'
import cli from 'cli-ux'

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
    const {flags, args} = this.parse(HelpCommand)
    const format = flags.format as any || 'screen'
    let id = args.command
    let help = new Help(this.config, {format})
    if (!id) {
      let rootHelp = help.root()
      cli.info(rootHelp)
    } else {
      let command = this.config.findCommand(id, {must: true})
      let commandHelp = help.command(command)
      cli.info(commandHelp)
    }
    if (format === 'screen') cli.info()
  }
}
