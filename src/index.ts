import * as Config from '@anycli/config'
import {error} from '@anycli/errors'
import chalk from 'chalk'
import indent = require('indent-string')

import CommandHelp from './command'
import {renderList} from './list'
import RootHelp from './root'
import {stdtermwidth} from './screen'
import {castArray, compact, sortBy, uniqBy} from './util'

const wrap = require('wrap-ansi')

export interface Article {
  title?: string
  sections: Section[]
}

export interface Section {
  heading: string
  type?: 'plain' | 'code'
  body: string | string[] | (string | undefined)[][]
}

const {
  bold,
} = chalk

export interface HelpOptions {
  all?: boolean
}

export default class Help {
  constructor(public config: Config.IConfig, public opts: HelpOptions = {}) {}

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
    let subject = getHelpSubject()
    let command
    let topic
    if (!subject) {
      let commands = this.config.commands
      commands = commands.filter(c => this.opts.all || !c.hidden)
      if (!this.opts.all) commands = commands.filter(c => !c.id.includes(':'))
      commands = sortBy(commands, c => c.id)
      commands = uniqBy(commands, c => c.id)
      console.log(this.root(commands))
    } else if (command = this.config.findCommand(subject)) {
      console.log(this.command(command))
    } else if (topic = this.config.findTopic(subject)) {
      console.log(this.topic(topic))
    } else {
      error(`command ${subject} not found`)
    }
    console.log()
  }

  root(commands: Config.Command[]): string {
    const help = new RootHelp(this.config, this.opts)
    const article = help.root(commands)
    return this.render(article)
  }

  topic(topic: Config.Topic): string {
    return topic.name
  }

  command(command: Config.Command): string {
    const help = new CommandHelp(this.config, this.opts)
    const article = help.command(command)
    return this.render(article)
  }

  protected render(article: Article): string {
    const maxWidth = stdtermwidth
    return compact([
      article.title,
      ...article.sections
      .map(s => {
        let body
        if (s.body.length === 0) {
          body = ''
        } else if (Array.isArray(s.body[0])) {
          body = renderList(s.body as any, {maxWidth: maxWidth - 2})
        } else {
          body = castArray(s.body as string).join('\n')
          body = wrap(body, maxWidth - 2, {trim: false, hard: true})
        }
        return compact([
          bold(s.heading.toUpperCase()),
          indent(body, 2),
        ]).join('\n')
      })
    ]).join('\n\n')
  }

  // protected renderMarkdown(article: Article): string {
  //   const maxWidth = 100
  //   return [
  //     stripAnsi(this.renderTemplate(article.title)),
  //     '',
  //     ...article.sections
  //     .map(s => {
  //       let body = '\n'
  //       if (s.body.length === 0) {
  //         body += ''
  //       } else if (Array.isArray(s.body[0])) {
  //         body += '```\n'
  //         body += renderList(s.body as any, {maxWidth: maxWidth - 2, stripAnsi: true})
  //         body += '\n```'
  //       } else {
  //         let output = castArray(s.body as string).join('\n')
  //         output = this.renderTemplate(output)
  //         body += wrap(stripAnsi(output), maxWidth - 2, {trim: false, hard: true})
  //       }
  //       if (s.type === 'code') {
  //         body = `\n\`\`\`sh-session${body}\n\`\`\``
  //       }
  //       return compact([
  //         `**${s.heading}**`,
  //         body,
  //       ]).join('\n') + '\n'
  //     })
  //   ].join('\n').trim()
  // }
}
