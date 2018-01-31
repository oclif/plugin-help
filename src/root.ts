import {IConfig} from '@anycli/config'
// import chalk from 'chalk'
import * as _ from 'lodash'

import {Article, Section} from '.'

// const {
//   underline,
//   dim,
//   blueBright,
// } = chalk

export interface RootOptions {
  all?: boolean
}

export default class RootHelp {
  opts: RootOptions

  constructor(public config: IConfig) {}

  root(opts: RootOptions = {}): Article {
    this.opts = opts
    return {
      title: this.config.pjson.anycli.title || this.config.pjson.description,
      sections: _([
        this.usage(),
        this.description(),
        this.commands(),
      ]).compact().value(),
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
    const commands = _(this.config.engine.commands)
    .filter(c => this.opts.all || !c.hidden)
    .sortBy(c => c.id)
    .sortedUniqBy(c => c.id)

    return {
      heading: 'commands',
      body: commands.map(c => [c.id, c.title]).value(),
    }
  }
}
