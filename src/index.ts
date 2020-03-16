import * as Config from '@oclif/config'
import {error} from '@oclif/errors'
import chalk from 'chalk'
import indent = require('indent-string')
import stripAnsi = require('strip-ansi')

import CommandHelp from './command'
import {renderList} from './list'
import RootHelp from './root'
import {stdtermwidth} from './screen'
import {compact, sortBy, template, uniqBy, getDefaultCommandId, getUsagePrefix} from './util'

const wrap = require('wrap-ansi')
const {
  bold,
} = chalk

export interface HelpOptions {
  all?: boolean;
  maxWidth: number;
  stripAnsi?: boolean;
  usagePrefix?: string; // default: '$ <config.bin> '
}

function getHelpSubject(args: string[]): string | undefined {
  // special case
  // if (['help:help', 'help:--help', '--help:help'].includes(argv.slice(0, 2).join(':'))) {
  // if (argv[0] === 'help') return 'help'

  for (const arg of args) {
    if (arg === '--') return
    if (arg.startsWith('-')) continue
    if (arg === 'help') continue
    return arg
  }
}

export default class Help {
  opts: HelpOptions

  render: (input: string) => string

  constructor(public config: Config.IConfig, opts: Partial<HelpOptions> = {}) {
    this.opts = {maxWidth: stdtermwidth, ...opts}
    this.render = template(this)
  }

  showHelp(argv: string[]) {
    let topics = this.config.topics
    topics = topics.filter(t => this.opts.all || !t.hidden)
    topics = sortBy(topics, t => t.name)
    topics = uniqBy(topics, t => t.name)
    const subject = getHelpSubject(argv)

    let command: Config.Command | undefined
    if (subject) {
      command = this.config.findCommand(subject)
    }

    let topic: Config.Topic | undefined
    if (subject && !command) {
      topic = this.config.findTopic(subject)
    }

    if (!subject) {
      console.log(this.root())
      console.log('')
      if (!this.opts.all) {
        topics = topics.filter(t => !t.name.includes(':'))
      }
      console.log(this.topics(topics))
      console.log('')
    } else if (command) {
      this.showCommandHelp(command, topics)
    } else if (topic) {
      const name = topic.name
      const depth = name.split(':').length
      topics = topics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
      console.log(this.topic(topic))
      if (topics.length > 0) {
        console.log(this.topics(topics))
        console.log('')
      }
    } else {
      error(`command ${subject} not found`)
    }
  }

  showCommandHelp(command: Config.Command, topics: Config.Topic[]) {
    const name = command.id
    const depth = name.split(':').length
    topics = topics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
    const title = command.description && this.render(command.description).split('\n')[0]
    if (title) console.log(title + '\n')
    console.log(this.command(command))
    console.log('')
    if (topics.length > 0) {
      console.log(this.topics(topics))
      console.log('')
    }
  }

  root(): string {
    const help = new RootHelp(this.config, this.opts)
    return help.root()
  }

  topic(topic: Config.Topic): string {
    let description = this.render(topic.description || '')
    const title = description.split('\n')[0]
    description = description.split('\n').slice(1).join('\n')
    const usagePrefix = getUsagePrefix(this.config, this.opts)
    let output = compact([
      title,
      [
        bold('USAGE'),
        indent(wrap(`${usagePrefix}${topic.name}:COMMAND`, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
      ].join('\n'),
      description && ([
        bold('DESCRIPTION'),
        indent(wrap(description, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
      ].join('\n')),
    ]).join('\n\n')
    if (this.opts.stripAnsi) output = stripAnsi(output)
    return output + '\n'
  }

  command(command: Config.Command): string {
    const help = new CommandHelp(command, this.config, this.opts)
    return help.generate()
  }

  topics(topics: Config.Topic[]): string | undefined {
    if (topics.length === 0) return
    const defaultCommandId = getDefaultCommandId(this.config)
    const body = renderList(topics.map(c => [
      defaultCommandId === c.name ? `${c.name} (default)` : c.name,
      c.description && this.render(c.description.split('\n')[0]),
    ]), {
      spacer: '\n',
      stripAnsi: this.opts.stripAnsi,
      maxWidth: this.opts.maxWidth - 2,
    })
    return [
      bold('COMMANDS'),
      indent(body, 2),
    ].join('\n')
  }
}

// function id(c: Config.Command | Config.Topic): string {
//   return (c as any).id || (c as any).name
// }
