import Command from '@dxcli/command'
import cli from 'cli-ux'

export default class HelpCommand extends Command {
  async run() {
    const name = this.flags.name || 'world'
    cli.log(`hello ${name}!`)
  }
}
