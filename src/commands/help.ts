import Command, {flags} from '@dxcli/command'
import {IConfig} from '@dxcli/config'
import cli from 'cli-ux'

import Help from '..'

const config: IConfig = global.dxcli.config

export default class HelpCommand extends Command {
  static title = `display help for ${config.bin}`
  static flags: flags.Input<HelpCommand['flags']> = {
    all: flags.boolean({description: 'see all commands in CLI'}),
    // format: flags.enum({description: 'output in a different format'}),
  }
  static args = [
    {name: 'command', required: false}
  ]
  flags: {
    all?: boolean
  }

  async run() {
    let id = this.args.command as string
    let help = new Help(this.config)
    let command = this.config.engine!.findCommand(id, true)
    let commandHelp = help.command(command)
    cli.info(commandHelp)
  }
}
