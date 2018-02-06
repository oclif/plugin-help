import * as Config from '@anycli/config'
import chalk from 'chalk'

import {Article, HelpOptions, Section} from '.'
import {castArray, compact, sortBy, uniqBy} from './util'

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
      sections: compact([
        this.usage(cmd, flags),
        this.args(args),
        this.flags(flags),
        this.description(cmd),
        this.aliases(cmd.aliases),
        this.subcommands(cmd),
      ]),
    }
  }

  // commandLine(cmd: ICachedCommand): [string, string | undefined] {
  //   return [buildUsage(cmd), cmd.description ? dim(cmd.description) : undefined] as [string, string | undefined]
  // }

  protected usage(cmd: Config.Command, flags: Config.Command.Flag[]): Section {
    return {
      heading: 'Usage',
      type: 'code',
      body: cmd.usage ? castArray(cmd.usage) : this.defaultUsage(cmd, flags)
    }
  }
  protected defaultUsage(command: Config.Command, flags: Config.Command.Flag[]): string {
    return compact([
      '$',
      this.config.bin,
      command.id,
      command.args.filter(a => !a.hidden).map(a => this.arg(a)).join(' '),
      flags.length && '[OPTIONS]',
    ])
    .join(' ')
  }

  protected description(cmd: Config.Command): Section | undefined {
    if (!cmd.description) return
    return {
      heading: 'Description',
      body: cmd.description.trim(),
    }
  }

  protected aliases(aliases: string[] | undefined): Section | undefined {
    if (!aliases || !aliases.length) return
    return {
      heading: 'Aliases',
      type: 'code',
      body: aliases.map(a => ['$', this.config.bin, a].join(' ')),
    }
  }

  protected args(args: Config.Command['args']): Section | undefined {
    if (!args.length) return
    return {
      heading: 'Arguments',
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
      heading: 'Options',
      body: sortBy(flags, f => [!f.char, f.char, f.name])
      .map(f => this.flag(f))
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

  protected subcommands(command: Config.Command) {
    let commands = this.config.commands
    commands = commands.filter(c => this.opts.all || !c.hidden)
    commands = commands.filter(c => c.id !== command.id && c.id.startsWith(command.id))
    commands = sortBy(commands, c => c.id)
    commands = uniqBy(commands, c => c.id)
    if (!commands.length) return
    if (this.opts.format === 'markdown') {
      return {
        heading: 'commands',
        body: commands.map(c => compact([`* [${c.id}](#${c.id})`, c.title]).join(' - '))
      }
    } else {
      return {
        heading: 'commands',
        body: commands.map(c => [c.id, c.title]),
      }
    }
  }
}
