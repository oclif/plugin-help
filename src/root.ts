import {IConfig} from '@anycli/config'
// import chalk from 'chalk'

import {Article, HelpOptions, Section} from '.'
import {compact, sortBy, uniqBy} from './util'

// const {
//   underline,
//   dim,
//   blueBright,
// } = chalk

export default class RootHelp {
  constructor(public config: IConfig, public opts: HelpOptions = {}) {}

  root(): Article {
    return {
      title: this.config.pjson.anycli.title || this.config.pjson.description,
      sections: compact([
        this.usage(),
        this.description(),
        this.commands(),
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

  protected commands(): Section | undefined {
    let commands = this.config.commands
    commands = commands.filter(c => this.opts.all || !c.hidden)
    commands = sortBy(commands, c => c.id)
    commands = uniqBy(commands, c => c.id)

    return {
      heading: 'commands',
      body: commands.map(c => [c.id, c.title]),
    }
  }
}
