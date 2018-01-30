import {Command} from '@dxcli/command'
import cli from 'cli-ux'

export default class Commands extends Command {
  // static flags: flags.Input<Commands['flags']> = {
  //   name: flags.string({char: 'n', description: 'name to print'})
  // }
  // flags: {
  //   name?: string
  // }

  async run() {
    const commands = this.config.engine!.commandIDs.slice(0)
    commands.sort()
    for (let id of commands) {
      cli.info(id)
    }
  }
}
