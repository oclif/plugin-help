import {Command} from '@oclif/command'

// import Help from '..'

export default class OptionsCommand extends Command {
  static description = 'display options'

  static args = [
    {name: 'options', required: true, description: 'some options that should show', options: ['first', 'second']}
  ]
  static strict = false

  async run() {
    // const {flags, argv} = this.parse(OptionsCommand)
    // let help = new Help(this.config, {all: flags.all})
    // help.showHelp(argv)
  }
}
