import * as Config from '@oclif/config'
import {error} from '@oclif/errors'
import chalk from 'chalk'
import indent = require('indent-string')
import stripAnsi = require('strip-ansi')

import CommandHelp from './command'
import {renderList} from './list'
import RootHelp from './root'
import {stdtermwidth} from './screen'
import {compact, sortBy, template, uniqBy} from './util'
export {getHelpClass} from './util'

const wrap = require('wrap-ansi')
const {
  bold,
} = chalk

export interface HelpOptions {
  all?: boolean;
  maxWidth: number;
  stripAnsi?: boolean;
}

function getHelpSubject(args: string[]): string | undefined {
  for (const arg of args) {
    if (arg === '--') return
    if (arg.startsWith('-')) continue
    if (arg === 'help') continue
    return arg
  }
}

export abstract class HelpBase {
  constructor(config: Config.IConfig, opts: Partial<HelpOptions> = {}) {
    this.config = config
    this.opts = {maxWidth: stdtermwidth, ...opts}
  }

  public config: Config.IConfig

  public opts: HelpOptions

  /**
   * Show help, used in multi-command CLIs
   * @param args passed into your command, useful for determining which type of help to display
   */
  public abstract showHelp(argv: string[]): void;

  /**
   * Show help for an individual command
   * @param command
   * @param topics
   */
  public abstract showCommandHelp(command: Config.Command, topics: Config.Topic[]): void;

  /**
   * Returned string is used for given the command in readme generation
   * @param command
   */
  public abstract getCommandHelpForReadme(command: Config.Command): string;
}

export default class Help extends HelpBase {
  render: (input: string) => string

  constructor(config: Config.IConfig, opts: Partial<HelpOptions> = {}) {
    super(config, opts)
    this.render = template(this)
  }

  public showHelp(argv: string[]) {
    let topics = this.config.topics
    topics = topics.filter(t => this.opts.all || !t.hidden)
    topics = sortBy(topics, t => t.name)
    topics = uniqBy(topics, t => t.name)

    const subject = getHelpSubject(argv)
    if (!subject) {
      this.showRootHelp(topics)
      return
    }

    const command = this.config.findCommand(subject)
    if (command) {
      this.showCommandHelp(command, topics)
      return
    }

    const topic = this.config.findTopic(subject)
    if (topic)  {
      const name = topic.name
      const depth = name.split(':').length
      const siblingTopics = topics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
      this.showTopicHelp(topic, siblingTopics)
      return
    }

    error(`command ${subject} not found`)
  }

  protected showRootHelp(topics: Config.Topic[]) {
    console.log(this.root())
    console.log('')
    if (!this.opts.all) {
      topics = topics.filter(t => !t.name.includes(':'))
    }
    console.log(this.topics(topics))
    console.log('')
  }

  protected showTopicHelp(topic: Config.Topic, siblingTopics: Config.Topic[]) {
    console.log(this.topic(topic))
    if (siblingTopics.length > 0) {
      console.log(this.topics(siblingTopics))
      console.log('')
    }
  }

  public showCommandHelp(command: Config.Command, topics: Config.Topic[]) {
    const name = command.id
    const depth = name.split(':').length
    topics = topics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
    const title = command.description && this.render(command.description).split('\n')[0]
    if (title) console.log(title + '\n')
    console.log(this.command(command))
    console.log('')
    if (topics.length > 0) {
      console.log(this.topics(topics))
      console.log('')
    }
  }

  protected root(): string {
    const help = new RootHelp(this.config, this.opts)
    return help.root()
  }

  protected topic(topic: Config.Topic): string {
    let description = this.render(topic.description || '')
    const title = description.split('\n')[0]
    description = description.split('\n').slice(1).join('\n')
    let output = compact([
      title,
      [
        bold('USAGE'),
        indent(wrap(`$ ${this.config.bin} ${topic.name}:COMMAND`, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
      ].join('\n'),
      description && ([
        bold('DESCRIPTION'),
        indent(wrap(description, this.opts.maxWidth - 2, {trim: false, hard: true}), 2),
      ].join('\n')),
    ]).join('\n\n')
    if (this.opts.stripAnsi) output = stripAnsi(output)
    return output + '\n'
  }

  /**
   * @param {Command} command to generate help for
   * @returns {string} help string for the given command
   */
  public getCommandHelpForReadme(command: Config.Command): string {
    return this.command(command)
  }

  /**
   * @deprecated replaced by getCommandHelpForReadme
   * @param {Command} command to generate help for
   * @returns {string} help string for the given command
   */
  public command(command: Config.Command): string {
    const help = new CommandHelp(command, this.config, this.opts)
    return help.generate()
  }

  protected topics(topics: Config.Topic[]): string | undefined {
    if (topics.length === 0) return
    const body = renderList(topics.map(c => [
      c.name,
      c.description && this.render(c.description.split('\n')[0]),
    ]), {
      spacer: '\n',
      stripAnsi: this.opts.stripAnsi,
      maxWidth: this.opts.maxWidth - 2,
    })
    return [
      bold('COMMANDS'),
      indent(body, 2),
    ].join('\n')
  }
}
