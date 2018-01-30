import {ICachedCommand, IConfig} from '@dxcli/config'
import * as screen from '@dxcli/screen'
import chalk from 'chalk'
import indent = require('indent-string')
import * as _ from 'lodash'

import CommandHelp from './command'

const width = require('string-width')
const wrap = require('wrap-ansi')

export interface Article {
  title?: string
  sections: Section[]
}

export interface Section {
  heading: string
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
  markdown?: boolean
}

function renderList(input: (string | undefined)[][], opts: {multiline?: boolean} = {}): string {
  if (input.length === 0) {
    return ''
  }
  let output = ''
  if (opts.multiline) {
    for (let [left, right] of input) {
      if (!left && !right) continue
      if (left) {
        output += indent(wrap(left.trim(), screen.stdtermwidth - 2, {hard: true, trim: false}), 2)
      }
      if (right) {
        output += '\n'
        output += indent(wrap(right.trim(), screen.stdtermwidth - 4, {hard: true, trim: false}), 6)
      }
      output += '\n\n'
    }
    return output
  }
  const maxLength = widestLine(input.map(i => i[0]).join('\n'))
  let spacer = '\n'
  let cur = ''
  for (let [left, right] of input) {
    if (cur) {
      output += spacer
      output += cur
    }
    cur = left || ''
    if (!right) {
      cur = cur.trim()
      continue
    }
    right = wrap(right.trim(), screen.stdtermwidth - (maxLength + 4), {hard: true, trim: false})
    // right = wrap(right.trim(), screen.stdtermwidth - (maxLength + 4), {hard: true, trim: false})
    const [first, ...lines] = right!.split('\n').map(s => s.trim())
    cur += ' '.repeat(maxLength - width(cur) + 2)
    cur += first
    if (lines.length === 0) {
      continue
    }
    // if we start putting too many lines down, render in multiline format
    // if (lines.length > 4) return renderList(input, {...opts, multiline: true})
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

export default class Help {
  constructor(public config: IConfig) {}

  command(command: ICachedCommand, _: HelpOptions = {}): string {
    const help = new CommandHelp(this.config)
    const article = help.command(command)
    return this.render(article)
  }

  protected render(article: Article): string {
    return _([
      article.title,
      ...article.sections
      .map(s => {
        let body
        if (s.body.length === 0) {
          body = ''
        } else if (_.isArray(s.body[0])) {
          body = renderList(s.body as any)
        } else {
          body = _.castArray(s.body as string).join('\n')
          body = wrap(body, screen.stdtermwidth - 2, {trim: false, hard: true})
        }
        return _([
          bold(s.heading.toUpperCase()),
          indent(body, 2),
        ]).compact().join('\n')
      })
    ]).compact().join('\n\n')
  }
}
