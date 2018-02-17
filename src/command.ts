import * as Config from '@oclif/config'
import chalk from 'chalk'
import indent = require('indent-string')
import stripAnsi = require('strip-ansi')

import {HelpOptions} from '.'
import {renderList} from './list'
import {castArray, compact, sortBy, template} from './util'

const {
  underline,
  dim,
  bold,
} = chalk

const wrap = require('wrap-ansi')

export default class CommandHelp {
  render: (input: string) => string
  constructor(public config: Config.IConfig, public opts: HelpOptions) {
    this.render = template(this)
  }

  command(cmd: Config.Command): string {
    const flags = sortBy(Object.entries(cmd.flags || {})
    .filter(([, v]) => !v.hidden)
    .map(([k, v]) => {
      v.name = k
      return v
    }), f => [!f.char, f.char, f.name])
    const args = (cmd.args || []).filter(a => !a.hidden)
    let output = compact([
      this.usage(cmd, flags),
      this.args(args),
      this.flags(flags),
      this.description(cmd),
      this.aliases(cmd.aliases),
      this.examples(cmd.examples),
    ]).join('\n\n')
    if (this.opts.stripAnsi) output = stripAnsi(output)
    return output
  }

  protected usage(cmd: Config.Command, flags: Config.Command.Flag[]): string {
    let body = (cmd.usage ? castArray(cmd.usage) : [this.defaultUsage(cmd, flags)])
    .map(u => `$ ${this.config.bin} ${u}`.trim())
    .join('\n')
    return [
      bold('USAGE'),
      indent(wrap(body, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
    ].join('\n')
  }

  protected defaultUsage(command: Config.Command, _: Config.Command.Flag[]): string {
    return compact([
      command.id,
      command.args.filter(a => !a.hidden).map(a => this.arg(a)).join(' '),
      // flags.length && '[OPTIONS]',
    ]).join(' ')
  }

  protected description(cmd: Config.Command): string | undefined {
    let description = cmd.description && this.render(cmd.description).split('\n').slice(1).join('\n')
    if (!description) return
    return [
      bold('DESCRIPTION'),
      indent(wrap(description, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
    ].join('\n')
  }

  protected aliases(aliases: string[] | undefined): string | undefined {
    if (!aliases || !aliases.length) return
    let body = aliases.map(a => ['$', this.config.bin, a].join(' ')).join('\n')
    return [
      bold('ALIASES'),
      indent(wrap(body, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
    ].join('\n')
  }

  protected examples(examples: string[] | undefined | string): string | undefined {
    if (!examples || !examples.length) return
    let body = castArray(examples).map(a => this.render(a)).join('\n')
    return [
      bold('EXAMPLE' + (examples.length > 1 ? 'S' : '')),
      indent(wrap(body, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
    ].join('\n')
  }

  protected args(args: Config.Command['args']): string | undefined {
    if (!args.filter(a => a.description).length) return
    let body = renderList(args.map(a => {
      const name = a.name.toUpperCase()
      let description = a.description || ''
      if (a.default) description = `[default: ${a.default}] ${description}`
      return [name, description ? dim(description) : undefined]
    }), {stripAnsi: this.opts.stripAnsi, maxWidth: this.opts.maxWidth - 2})
    return [
      bold('ARGUMENTS'),
      indent(body, 2),
    ].join('\n')
  }
  protected arg(arg: Config.Command['args'][0]): string {
    let name = arg.name.toUpperCase()
    if (arg.required) return `${name}`
    return `[${name}]`
  }

  protected flags(flags: Config.Command.Flag[]): string | undefined {
    if (!flags.length) return
    let body = renderList(flags.map(flag => {
      const label = []
      if (flag.char) label.push(`-${flag.char[0]}`)
      if (flag.name) label.push(`--${flag.name.trim()}`)
      let left = label.join(', ')
      if (flag.type === 'option') {
        let value = flag.helpValue || flag.name
        if (!value.includes('(')) value = underline(value)
        left += `=${value}`
      }

      let right = flag.description || ''
      if (flag.type === 'option' && flag.default) {
        right = `[default: ${flag.default}] ${right}`
      }
      if (flag.required) right = `(required) ${right}`

      return [left, dim(right.trim())]
    }), {stripAnsi: this.opts.stripAnsi, maxWidth: this.opts.maxWidth - 2})
    return [
      bold('OPTIONS'),
      indent(body, 2),
    ].join('\n')
  }
}
