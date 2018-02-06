import * as Config from '@anycli/config'
// import chalk from 'chalk'

import {Article, HelpOptions, Section} from '.'
import {compact} from './util'

// const {
//   underline,
//   dim,
//   blueBright,
// } = chalk

export default class RootHelp {
  constructor(public config: Config.IConfig, public opts: HelpOptions = {}) {}

  root(commands: Config.Command[]): Article {
    return {
      title: this.config.pjson.anycli.title || this.config.pjson.description,
      sections: compact([
        this.usage(),
        this.description(),
        this.commands(commands),
      ])
    }
  }

  protected usage(): Section {
    return {
      heading: 'usage',
      body: `$ ${this.config.bin} [COMMAND]`,
    }
  }

  protected description(): Section | undefined {
    if (!this.config.pjson.description) return
    return {
      heading: 'description',
      body: this.config.pjson.description,
    }
  }

  protected commands(commands: Config.Command[]): Section | undefined {
    if (commands.length === 0) return
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
