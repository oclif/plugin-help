import {Command, flags, parse} from '@anycli/command'
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

  options = parse(this.argv, HelpCommand)

  async run() {
    const format = this.options.flags.format as any || 'screen'
    let id = this.options.args.command
    let help = new Help(this.config, {format})
    if (!id) {
      let rootHelp = help.root()
      cli.info(rootHelp)
    } else {
      let command = this.config.engine!.findCommand(id, true)
      let commandHelp = help.command(command)
      cli.info(commandHelp)
    }
    if (format === 'screen') cli.info()
  }
}
