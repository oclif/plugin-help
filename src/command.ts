import * as Config from '@anycli/config'
import chalk from 'chalk'
import * as _ from 'lodash'

import {Article, HelpOptions, Section} from '.'

const {
  underline,
  dim,
  // blueBright,
} = chalk

export default class CommandHelp {
  constructor(public config: Config.IConfig, public opts: HelpOptions) {}

  command(cmd: Config.Command): Article {
    const flagDefs = cmd.flags || {}
    const flags = Object.keys(flagDefs)
    .filter(k => !flagDefs[k].hidden)
    .map(k => {
      flagDefs[k].name = k
      return flagDefs[k]
    })
    const args = (cmd.args || []).filter(a => !a.hidden)
    return {
      title: cmd.title,
      sections: _([
        this.usage(cmd, flags),
        this.args(args),
        this.flags(flags),
        this.description(cmd),
        this.aliases(cmd.aliases),
      ]).compact().value(),
    }
  }

  // commandLine(cmd: ICachedCommand): [string, string | undefined] {
  //   return [buildUsage(cmd), cmd.description ? dim(cmd.description) : undefined] as [string, string | undefined]
  // }

  protected usage(cmd: Config.Command, flags: Config.Command.Flag[]): Section {
    return {
      heading: 'usage',
      type: 'code',
      body: cmd.usage ? _.castArray(cmd.usage) : this.defaultUsage(cmd, flags)
    }
  }
  protected defaultUsage(command: Config.Command, flags: Config.Command.Flag[]): string {
    return _([
      '$',
      this.config.bin,
      command.id,
      command.args.filter(a => !a.hidden).map(a => this.arg(a)).join(' '),
      flags.length && '[OPTIONS]',
    ])
    .compact()
    .join(' ')
  }

  protected description(cmd: Config.Command): Section | undefined {
    if (!cmd.description) return
    return {
      heading: 'description',
      body: cmd.description.trim(),
    }
  }

  protected aliases(aliases: string[] | undefined): Section | undefined {
    if (!aliases || !aliases.length) return
    return {
      heading: 'aliases',
      type: 'code',
      body: aliases.map(a => ['$', this.config.bin, a].join(' ')),
    }
  }

  protected args(args: Config.Command['args']): Section | undefined {
    if (!args.length) return
    return {
      heading: 'arguments',
      body: args.map(a => {
        const name = a.name.toUpperCase()
        let description = a.description || ''
        if (a.default) description = `[default: ${a.default}] ${description}`
        return [name, description ? dim(description) : undefined]
      })
    }
  }
  protected arg(arg: Config.Command['args'][0]): string {
    let name = arg.name.toUpperCase()
    if (arg.required) return `${name}`
    return `[${name}]`
  }

  protected flags(flags: Config.Command.Flag[]): Section | undefined {
    if (!flags.length) return
    return {
      heading: 'options',
      body: _(flags)
      .sortBy(f => [!f.char, f.char, f.name])
      .map(f => this.flag(f))
      .value(),
    }
  }

  protected flag(flag: Config.Command.Flag): [string, string | undefined] {
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
  }
}
