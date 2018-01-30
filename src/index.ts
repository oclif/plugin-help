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

function renderList(input: (string | undefined)[][]): string {
  if (input.length === 0) {
    return ''
  }
  const maxLength = widestLine(input.map(i => i[0]).join('\n'))
  let multiline = false
  return input.map(i => {
    let output = i[0] || ''
    let right = i[1]
    if (!right) return output.trim()
    right = wrap(right.trim(), screen.stdtermwidth - (maxLength + 4), {hard: true, trim: false})
    const [first, ...lines] = right!.split('\n').map(s => s.trim())
    output += ' '.repeat(maxLength - width(output) + 2)
    output += first
    if (lines.length === 0) return output
    multiline = true
    output += '\n'
    output += indent(lines.join('\n'), maxLength + 2)
    return output
  }).join('\n'.repeat(multiline ? 2 : 1))
}

export default class Help {
  constructor(public config: IConfig) {}

  command(command: ICachedCommand): string {
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
