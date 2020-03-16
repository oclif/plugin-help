import * as Config from '@oclif/config'
import chalk from 'chalk'
import escapeStringRegexp = require('escape-string-regexp')
import indent = require('indent-string')
import stripAnsi = require('strip-ansi')

import {HelpOptions} from '.'
import {renderList} from './list'
import {castArray, compact, sortBy, template, getDefaultCommandId, getUsagePrefix} from './util'

const {
  underline,
  bold,
} = chalk
let {
  dim,
} = chalk

if (process.env.ConEmuANSI === 'ON') {
  dim = chalk.gray
}

const wrap = require('wrap-ansi')

export type UsageOptions = {
  omitCommandNameIfDefault?: boolean
}

export default class CommandHelp {
  render: (input: string) => string

  constructor(public command: Config.Command, public config: Config.IConfig, public opts: HelpOptions) {
    this.render = template(this)
  }

  static getCommandFlags(cmd: Config.Command) {
    const flags = sortBy(Object.entries(cmd.flags || {})
    .filter(([, v]) => !v.hidden)
    .map(([k, v]) => {
      v.name = k
      return v
    }), f => [!f.char, f.char, f.name])
    return flags
  }

  generate(): string {
    const cmd = this.command
    const flags = CommandHelp.getCommandFlags(cmd)
    const args = (cmd.args || []).filter(a => !a.hidden)
    let output = compact([
      this.usage(flags),
      this.args(args),
      this.flags(flags),
      this.description(),
      this.aliases(cmd.aliases),
      this.examples(cmd.examples || (cmd as any).example),
    ]).join('\n\n')
    if (this.opts.stripAnsi) output = stripAnsi(output)
    return output
  }

  transformUsages(usages: string[], usageOptions?: UsageOptions) {
    usageOptions = usageOptions || {}
    let result = usages
    const defaultCommandId = getDefaultCommandId(this.config)
    if (defaultCommandId === this.command.id) {
      const binEscaped = escapeStringRegexp(this.config.bin)
      const commandEscaped = escapeStringRegexp(defaultCommandId)
      const commandRegex = new RegExp(`^(.*(?:\\b${
        binEscaped
      }|<%=\\s*config\\.bin\\s*%>)\\s*.*\\s)(<%=\\s*command\\.id\\s*%>|${commandEscaped})(\\s+|$)`)
      console.log(commandRegex)
      const transformedCommandName = this.transformCommandName(defaultCommandId, usageOptions)
      result = usages.map(usage => {
        const groups = commandRegex.exec(usage)
        if (groups) {
          const prefix = groups[1]
          const commandRef = groups[2]
          const prefixCommandRef = `${prefix}${commandRef}`
          const partAfterCommandRef = usage.substr(prefixCommandRef.length).trimLeft()

          const transformedPrefixCommand = `${prefix}${transformedCommandName}`
          usage = `${transformedPrefixCommand}${partAfterCommandRef}`
        }
        return usage
      })
    }
    return result.map(u => u.trim())
  }

  usageBase(flags: Config.Command.Flag[], options?: UsageOptions) {
    let usages = this.command.usage ? castArray(this.command.usage) : undefined
    if (usages) {
      usages = this.transformUsages(usages, options)
    } else {
      usages = [this.defaultUsage(flags, options)]
    }
    const prefix = getUsagePrefix(this.config, this.opts)
    return usages.map(u => {
      let line = prefix + this.render(u).trimRight()
      if (this.opts.stripAnsi) {
        line = stripAnsi(line)
      }
      return line
    })
  }

  protected usage(flags: Config.Command.Flag[], options?: UsageOptions): string {
    return [
      bold('USAGE'),
      ...this.usageBase(flags, options).map(u => indent(wrap(u, this.opts.maxWidth - 2, {trim: false, hard: true}), 2))
    ].join('\n')
  }

  protected transformCommandName(name: string, options?: UsageOptions) {
    options = options || {}
    if (name === getDefaultCommandId(this.config)) {
      name = options.omitCommandNameIfDefault ? '' : this.optionalize(name)
    }
    return name
  }

  protected defaultUsage(_flags: Config.Command.Flag[], options?: UsageOptions): string {
    return compact([
      this.transformCommandName(this.command.id, options),
      this.command.args.filter(a => !a.hidden).map(a => this.arg(a)).join(' '),
      // flags.length && '[OPTIONS]',
    ]).join(' ')
  }

  protected description(): string | undefined {
    const cmd = this.command
    const description = cmd.description && this.render(cmd.description).split('\n').slice(1).join('\n')
    if (!description) return
    return [
      bold('DESCRIPTION'),
      indent(wrap(description.trim(), this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
    ].join('\n')
  }

  protected aliases(aliases: string[] | undefined): string | undefined {
    if (!aliases || aliases.length === 0) return
    const body = aliases.map(a => ['$', this.config.bin, a].join(' ')).join('\n')
    return [
      bold('ALIASES'),
      indent(wrap(body, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
    ].join('\n')
  }

  protected examples(examples: string[] | undefined | string): string | undefined {
    if (!examples || examples.length === 0) return
    examples = this.transformUsages(castArray(examples), {omitCommandNameIfDefault: true})
    const body = examples.map(a => this.render(a)).join('\n')
    return [
      bold('EXAMPLE' + (examples.length > 1 ? 'S' : '')),
      indent(wrap(body, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
    ].join('\n')
  }

  protected args(args: Config.Command['args']): string | undefined {
    if (args.filter(a => a.description).length === 0) return
    const body = renderList(args.map(a => {
      const name = a.name.toUpperCase()
      let description = a.description || ''
      if (a.default) description = `[default: ${a.default}] ${description}`
      if (a.options) description = `(${a.options.join('|')}) ${description}`
      return [name, description ? dim(description) : undefined]
    }), {stripAnsi: this.opts.stripAnsi, maxWidth: this.opts.maxWidth - 2})
    return [
      bold('ARGUMENTS'),
      indent(body, 2),
    ].join('\n')
  }

  protected optionalize(text: string) {
    return `[${text}]`
  }

  protected arg(arg: Config.Command['args'][0]): string {
    const name = arg.name.toUpperCase()
    if (arg.required) return `${name}`
    return this.optionalize(name)
  }

  protected flags(flags: Config.Command.Flag[]): string | undefined {
    if (flags.length === 0) return
    const body = renderList(flags.map(flag => {
      let left = flag.helpLabel

      if (!left) {
        const label = []
        if (flag.char) label.push(`-${flag.char[0]}`)
        if (flag.name) {
          if (flag.type === 'boolean' && flag.allowNo) {
            label.push(`--[no-]${flag.name.trim()}`)
          } else {
            label.push(`--${flag.name.trim()}`)
          }
        }
        left = label.join(', ')
      }

      if (flag.type === 'option') {
        let value = flag.helpValue || flag.name
        if (!flag.helpValue && flag.options) {
          value = flag.options.join('|')
        }
        if (!value.includes('|')) value = underline(value)
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
