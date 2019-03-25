import * as Config from '@oclif/config'
import {error} from '@oclif/errors'
import chalk from 'chalk'
import indent = require('indent-string')
import stripAnsi = require('strip-ansi')

import CommandHelp from './command'
import {renderList} from './list'
import RootHelp from './root'
import {stdtermwidth} from './screen'
import {compact, sortBy, template, uniqBy} from './util'

const wrap = require('wrap-ansi')
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
      // if (argv[0] === 'help') return 'help'

      for (let arg of argv) {
        if (arg === '--') return
        if (arg.startsWith('-')) continue
        if (arg === 'help') continue
        return arg
      }
    }
    let topics = this.config.topics
    topics = topics.filter(t => this.opts.all || !t.hidden)
    topics = sortBy(topics, t => t.name)
    topics = uniqBy(topics, t => t.name)
    let subject = getHelpSubject()
    let command: Config.Command | undefined
    let topic: Config.Topic | undefined
    if (!subject) {
      console.log(this.root())
      console.log()
      if (!this.opts.all) {
        topics = topics.filter(t => !t.name.includes(':'))
      }
      console.log(this.topics(topics))
      console.log()
    } else if (command = this.config.findCommand(subject)) {
      this.showCommandHelp(command, topics)
    } else if (topic = this.config.findTopic(subject)) {
      const name = topic.name
      const depth = name.split(':').length
      topics = topics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
      console.log(this.topic(topic))
      if (topics.length) {
        console.log(this.topics(topics))
        console.log()
      }
    } else {
      error(`command ${subject} not found`)
    }
  }

  showCommandHelp(command: Config.Command, topics: Config.Topic[]) {
    const name = command.id
    const depth = name.split(':').length
    topics = topics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
    let title = command.description && this.render(command.description).split('\n')[0]
    if (title) console.log(title + '\n')
    console.log(this.command(command))
    console.log()
    if (topics.length) {
      console.log(this.topics(topics))
      console.log()
    }
  }

  root(): string {
    const help = new RootHelp(this.config, this.opts)
    return help.root()
  }

  topic(topic: Config.Topic): string {
    let description = this.render(topic.description || '')
    let title = description.split('\n')[0]
    description = description.split('\n').slice(1).join('\n')
    let output = compact([
      title,
      [
        bold('USAGE'),
        indent(wrap(`$ ${this.config.bin} ${topic.name}:COMMAND`, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
      ].join('\n'),
      description && ([
        bold('DESCRIPTION'),
        indent(wrap(description, this.opts.maxWidth - 2, {trim: false, hard: true}), 2)
      ].join('\n'))
    ]).join('\n\n')
    if (this.opts.stripAnsi) output = stripAnsi(output)
    return output + '\n'
  }

  command(command: Config.Command): string {
    const help = new CommandHelp(command, this.config, this.opts)
    return help.generate()
  }

  topics(topics: Config.Topic[]): string | undefined {
    if (!topics.length) return

    let Topics: Array<string | undefined>[] = []
    let Commands: Array<string | undefined>[] = []

    topics.map(t => {
      let out = [
        t.name,
        t.description && this.render(t.description.split('\n')[0])
      ]
      if (this.config.commandIDs.includes(t.name)) {
        Commands.push(out)
      }
      let tp = this.config.commandIDs.find(id => {
        if (id.match(`${t.name}:`)) return true
        return false
      })
      if (tp) {
        Topics.push(out)
      }
    })

    let commandsList = renderList(Commands, {
      spacer: '\n',
      stripAnsi: this.opts.stripAnsi,
      maxWidth: this.opts.maxWidth - 2,
    })

    let output = [
      [
        bold('COMMANDS'),
        indent(commandsList, 2),
      ].join('\n')
    ]

    if (Topics.length) {
      let topicsList = renderList(Topics, {
        spacer: '\n',
        stripAnsi: this.opts.stripAnsi,
        maxWidth: this.opts.maxWidth - 2,
      })
      output.push(
        [
          bold('TOPICS'),
          indent('Run help for each topic below to view its subcommands\n', 2),
          indent(topicsList, 2),
        ].join('\n')
      )
    }

    return output.join('\n\n')
  }
}

// function id(c: Config.Command | Config.Topic): string {
//   return (c as any).id || (c as any).name
// }
