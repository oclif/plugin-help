import * as Config from '@anycli/config'

import {Article, HelpOptions, Section} from '.'
import {compact, template} from './util'

export default class RootHelp {
  render: (input: string) => string

  constructor(public config: Config.IConfig, public opts: HelpOptions = {}) {
    this.render = template(this)
  }

  root(commands: Config.Command[]): Article {
    return {
      title: this.config.pjson.anycli.description || this.config.pjson.description,
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
    return {
      heading: 'commands',
      body: commands.map(c => [
        c.id,
        c.description && this.render(c.description.split('\n')[0]),
      ]),
    }
  }
}
