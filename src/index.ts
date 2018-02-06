import * as Config from '@anycli/config'
import {error} from '@anycli/errors'
import chalk from 'chalk'
import indent = require('indent-string')

import CommandHelp from './command'
import {renderList} from './list'
import RootHelp from './root'
import {stdtermwidth} from './screen'
import {sortBy, template, uniqBy} from './util'

const {
  bold,
} = chalk

export interface HelpOptions {
  all?: boolean
  maxWidth: number
  stripAnsi?: boolean
}

export default class Help {
  opts: HelpOptions
  render: (input: string) => string

  constructor(public config: Config.IConfig, opts: Partial<HelpOptions> = {}) {
    this.opts = {maxWidth: stdtermwidth, ...opts}
    this.render = template(this)
  }

  showHelp(argv: string[]) {
    const getHelpSubject = () => {
      // special case
      // if (['help:help', 'help:--help', '--help:help'].includes(argv.slice(0, 2).join(':'))) {
      if (argv[0] === 'help') return 'help'

      for (let arg of argv) {
        if (arg === '--') return
        if (arg.startsWith('-')) continue
        if (arg === 'help') continue
        return arg
      }
    }
    let commands = this.config.commands
    commands = commands.filter(c => this.opts.all || !c.hidden)
    commands = sortBy(commands, c => c.id)
    commands = uniqBy(commands, c => c.id)
    let subject = getHelpSubject()
    let command: Config.Command | undefined
    let topic
    if (!subject) {
      if (!this.opts.all) commands = commands.filter(c => !c.id.includes(':'))
      console.log(this.root())
      console.log()
      if (commands.length) {
        console.log(this.commands(commands))
        console.log()
      }
    } else if (command = this.config.findCommand(subject)) {
      commands = commands.filter(c => c.id !== command!.id && c.id.startsWith(command!.id))
      console.log(this.command(command))
      console.log()
      if (commands.length) {
        console.log(this.commands(commands))
        console.log()
      }
    } else if (topic = this.config.findTopic(subject)) {
      console.log(this.topic(topic))
      console.log()
      if (commands.length) {
        console.log(this.commands(commands))
        console.log()
      }
    } else {
      error(`command ${subject} not found`)
    }
  }

  root(): string {
    const help = new RootHelp(this.config, this.opts)
    return help.root()
  }

  topic(topic: Config.Topic): string {
    return topic.name
  }

  command(command: Config.Command): string {
    const help = new CommandHelp(this.config, this.opts)
    return help.command(command)
  }

  commands(commands: Config.Command[]): string | undefined {
    if (!commands.length) return
    let body = renderList(commands.map(c => [
      c.id,
      c.description && this.render(c.description.split('\n')[0])
    ]), {stripAnsi: this.opts.stripAnsi, maxWidth: this.opts.maxWidth - 2})
    return [
      bold('COMMANDS'),
      indent(body, 2),
    ].join('\n')
  }
}
