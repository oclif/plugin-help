import {ICachedArg, ICachedCommand, ICachedFlag, IConfig} from '@dxcli/config'
import chalk from 'chalk'
import * as _ from 'lodash'

import {Article, Section} from '.'

const {
  underline,
  dim,
} = chalk

export default class CommandHelp {
  constructor(public config: IConfig) {}

  command(cmd: ICachedCommand): Article {
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
        this.aliases(cmd.aliases),
      ]).compact().value(),
    }
  }

  // commandLine(cmd: ICachedCommand): [string, string | undefined] {
  //   return [buildUsage(cmd), cmd.description ? dim(cmd.description) : undefined] as [string, string | undefined]
  // }

  protected usage(cmd: ICachedCommand, flags: ICachedFlag[]): Section {
    return {
      heading: 'usage',
      body: cmd.usage ? _.castArray(cmd.usage) : this.defaultUsage(cmd, flags)
    }
  }
  protected defaultUsage(command: ICachedCommand, flags: ICachedFlag[]): string {
    return _([
      '$',
      this.config.bin,
      command.id,
      command.args.map(a => this.arg(a)).join(' '),
      flags.length && dim('[OPTIONS]'),
    ])
    .compact()
    .join(' ')
  }

  protected description(cmd: ICachedCommand): Section | undefined {
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
      body: aliases.map(a => ['$', this.config.bin, a].join(' ')),
    }
  }

  protected args(args: ICachedCommand['args']): Section | undefined {
    if (!args.find(f => !!f.description)) return
    return {
      heading: 'arguments',
      body: args.map(a => {
        return [a.name!.toUpperCase(), a.description ? dim(a.description) : undefined]
      })
    }
  }
  protected arg(arg: ICachedArg): string {
    let name = arg.name.toUpperCase()
    if (arg.required) return `${name}`
    return `[${name}]`
  }

  protected flags(flags: ICachedFlag[]): Section | undefined {
    if (!flags.length) return
    return {
      heading: 'options',
      body: _(flags)
      .sortBy(f => [!f.char, f.char, f.name])
      .map(f => this.flag(f))
      .value(),
    }
  }

  protected flag(flag: ICachedFlag): [string, string | undefined] {
    const label = []
    if (flag.char) label.push(`-${flag.char}`)
    if (flag.name) label.push(` --${flag.name}`)
    let left = label.join(',').trim()
    if (flag.type === 'option') left += `=${underline(flag.name)}`

    let right = flag.description || ''
    if (flag.required) right = `(required) ${right}`

    return [left, dim(right.trim())]
  }
}