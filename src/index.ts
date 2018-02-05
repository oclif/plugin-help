import * as Config from '@anycli/config'
import chalk from 'chalk'
import indent = require('indent-string')
import template = require('lodash.template')
import stripAnsi = require('strip-ansi')

import CommandHelp from './command'
import RootHelp from './root'
import {stdtermwidth} from './screen'
import {castArray, compact} from './util'

const width = require('string-width')
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

const widestLine = require('widest-line')

// function* ansiSplit(input: string, char: string) {
//   // tslint:disable no-constant-condition
//   while (true) {
//     let idx = input.indexOf(char)
//     if (idx === -1) return input
//     yield sliceAnsi(input, 0, idx)
//     input = sliceAnsi(input, idx, input.length)
//   }
// }

export interface HelpOptions {
  format?: 'markdown' | 'screen' | 'man'
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
    const subject = getHelpSubject()
    if (!subject) {
      console.log(this.root())
    } else {
      // TODO: topic help
      let command = this.config.findCommand(subject, {must: true})
      console.log(this.command(command))
    }
    if (this.opts.format === 'screen') console.log()
  }

  root(): string {
    const help = new RootHelp(this.config, this.opts)
    const article = help.root()
    return this.render(article)
  }

  command(command: Config.Command): string {
    const help = new CommandHelp(this.config, this.opts)
    const article = help.command(command)
    return this.render(article)
  }

  protected render(article: Article): string {
    switch (this.opts.format) {
      case 'markdown': return this.renderMarkdown(article)
      case 'man':
      case 'screen':
      default: return this.renderScreen(article)
    }
  }

  protected renderMarkdown(article: Article): string {
    const maxWidth = 100
    return [
      stripAnsi(this.renderTemplate(article.title)),
      '-'.repeat(width(article.title)),
      '',
      ...article.sections
      .map(s => {
        let body = '\n'
        if (s.body.length === 0) {
          body += ''
        } else if (Array.isArray(s.body[0])) {
          body += '```\n'
          body += this.renderList(s.body as any, {maxWidth: maxWidth - 2, stripAnsi: true})
          body += '\n```'
        } else {
          let output = castArray(s.body as string).join('\n')
          output = this.renderTemplate(output)
          body += wrap(stripAnsi(output), maxWidth - 2, {trim: false, hard: true})
        }
        if (s.type === 'code') {
          body = `\n\`\`\`sh-session${body}\n\`\`\``
        }
        return compact([
          `**${s.heading}**`,
          body,
        ]).join('\n') + '\n'
      })
    ].join('\n').trim()
  }

  protected renderScreen(article: Article): string {
    const maxWidth = stdtermwidth
    return compact([
      this.renderTemplate(article.title),
      ...article.sections
      .map(s => {
        let body
        if (s.body.length === 0) {
          body = ''
        } else if (Array.isArray(s.body[0])) {
          body = this.renderList(s.body as any, {maxWidth: maxWidth - 2})
        } else {
          body = castArray(s.body as string).join('\n')
          body = this.renderTemplate(body)
          body = wrap(body, maxWidth - 2, {trim: false, hard: true})
        }
        return compact([
          bold(s.heading.toUpperCase()),
          indent(body, 2),
        ]).join('\n')
      })
    ]).join('\n\n')
  }

  protected renderTemplate(t: string | undefined): string {
    return template(t || '')({config: this.config})
  }

  protected renderList(input: (string | undefined)[][], opts: {maxWidth: number, multiline?: boolean, stripAnsi?: boolean}): string {
    if (input.length === 0) {
      return ''
    }
    input = input.map(([left, right]) => {
      return [this.renderTemplate(left), this.renderTemplate(right)]
    })
    const renderMultiline = () => {
      output = ''
      for (let [left, right] of input) {
        if (!left && !right) continue
        if (left) {
          if (opts.stripAnsi) left = stripAnsi(left)
          output += wrap(left.trim(), opts.maxWidth, {hard: true, trim: false})
        }
        if (right) {
          if (opts.stripAnsi) right = stripAnsi(right)
          output += '\n'
          output += indent(wrap(right.trim(), opts.maxWidth - 2, {hard: true, trim: false}), 4)
        }
        output += '\n\n'
      }
      return output.trim()
    }
    if (opts.multiline) return renderMultiline()
    const maxLength = widestLine(input.map(i => i[0]).join('\n'))
    let output = ''
    let spacer = '\n'
    let cur = ''
    for (let [left, right] of input) {
      if (cur) {
        output += spacer
        output += cur
      }
      cur = left || ''
      if (opts.stripAnsi) cur = stripAnsi(cur)
      if (!right) {
        cur = cur.trim()
        continue
      }
      if (opts.stripAnsi) right = stripAnsi(right)
      right = wrap(right.trim(), opts.maxWidth - (maxLength + 2), {hard: true, trim: false})
      // right = wrap(right.trim(), screen.stdtermwidth - (maxLength + 4), {hard: true, trim: false})
      const [first, ...lines] = right!.split('\n').map(s => s.trim())
      cur += ' '.repeat(maxLength - width(cur) + 2)
      cur += first
      if (lines.length === 0) {
        continue
      }
      // if we start putting too many lines down, render in multiline format
      if (lines.length > 4) return renderMultiline()
      spacer = '\n\n'
      cur += '\n'
      cur += indent(lines.join('\n'), maxLength + 2)
    }
    if (cur) {
      output += spacer
      output += cur
    }
    return output.trim()
  }
}
