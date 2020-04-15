// used in tests for getHelpClass
import {HelpBase} from '.'

export default class extends HelpBase  {
  showHelp() {
    console.log('help')
  }

  showCommandHelp() {
    console.log('command help')
  }

  getCommandHelpForReadme() {
    return 'help for readme'
  }
}
