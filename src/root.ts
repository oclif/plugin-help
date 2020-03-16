import * as Config from '@oclif/config'
import chalk from 'chalk'
import indent = require('indent-string')
import stripAnsi = require('strip-ansi')

import {HelpOptions} from '.'
import {compact, template, getUsagePrefix} from './util'
import CommandHelp from './command'

const wrap = require('wrap-ansi')
const {
  bold,
} = chalk

export default class RootHelp {
  render: (input: string) => string

  constructor(public config: Config.IConfig, public opts: HelpOptions) {
    this.render = template(this)
  }

  root(): string {
    let description = this.config.pjson.oclif.description || this.config.pjson.description || ''
    description = this.render(description)
    description = description.split('\n')[0]
    let output = compact([
      description,
      this.version(),
      this.usage(),
      this.description(),
    ]).join('\n\n')
    if (this.opts.stripAnsi) output = stripAnsi(output)
    return output
  }

  usageBase() {
    const usagePrefix = getUsagePrefix(this.config, this.opts)
    const generalUsage = `${usagePrefix}[COMMAND]`
    let usages: string[] = [
      generalUsage,
    ]
    const defaultCommandId = (this.config.pjson.oclif as {defaultCommand?: string}).defaultCommand
    if (defaultCommandId) {
      const command = this.config.findCommand(defaultCommandId)
      if (command) {
        const commandHelp = new CommandHelp(command, this.config, this.opts)
        const defaultCommandUsages = commandHelp.usageBase(CommandHelp.getCommandFlags(command),
            {omitCommandNameIfDefault: true})
        usages = [
          ...usages,
          ...defaultCommandUsages,
        ]
      }
    }
    return usages
  }

  protected usage(): string {
    return [
      bold('USAGE'),
      ...this.usageBase().map(u => indent(wrap(u, this.opts.maxWidth - 2, {trim: false, hard: true}), 2))
    ].join('\n')
  }

  protected description(): string | undefined {
    let description = this.config.pjson.oclif.description || this.config.pjson.description || ''
    description = this.render(description)
    description = description.split('\n').slice(1).join('\n')
    if (!description) return
    return [
      bold('DESCRIPTION'),
      indent(wrap(description, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
    ].join('\n')
  }

  protected version(): string {
    return [
      bold('VERSION'),
      indent(wrap(this.config.userAgent, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
    ].join('\n')
  }
}
