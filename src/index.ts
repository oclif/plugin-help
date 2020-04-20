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
}

export default class Help extends HelpBase {
  render: (input: string) => string

  protected get filteredTopics() {
    let topics = this.config.topics
    topics = topics.filter(t => this.opts.all || !t.hidden)
    topics = sortBy(topics, t => t.name)
    topics = uniqBy(topics, t => t.name)

    return topics
  }

  constructor(config: Config.IConfig, opts: Partial<HelpOptions> = {}) {
    super(config, opts)
    this.render = template(this)
  }

  public showHelp(argv: string[]) {
    const subject = getHelpSubject(argv)

    if (!subject) {
      this.showRootHelp()
      return
    }

    const command = this.config.findCommand(subject)
    if (command) {
      this.showCommandHelp(command)
      return
    }

    const topic = this.config.findTopic(subject)
    if (topic)  {
      this.showTopicHelp(topic)
      return
    }

    error(`command ${subject} not found`)
  }

  public showCommandHelp(command: Config.Command) {
    const name = command.id
    const depth = name.split(':').length
    const topics = this.filteredTopics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
    const title = command.description && this.render(command.description).split('\n')[0]
    if (title) console.log(title + '\n')
    console.log(this.formatCommand(command))
    console.log('')

    if (topics.length > 0) {
      console.log(this.formatTopics(topics))
      console.log('')
    }
  }

  protected showRootHelp() {
    let rootChildren = this.filteredTopics

    console.log(this.formatRoot())
    console.log('')

    if (!this.opts.all) {
      rootChildren = rootChildren.filter(t => !t.name.includes(':'))
    }

    const {topics, commands} = this.categorizeTopicsAndCommands(rootChildren)

    if (topics.length > 0) {
      console.log(this.formatTopics(topics))
      console.log('')
    }

    if (commands.length > 0) {
      console.log(this.formatCommands(commands))
      console.log('')
    }
  }

  protected showTopicHelp(topic: Config.Topic) {
    const name = topic.name
    const depth = name.split(':').length

    const topicChildren = this.filteredTopics.filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
    const {topics, commands} = this.categorizeTopicsAndCommands(topicChildren)

    console.log(this.formatTopic(topic))

    if (topics.length > 0) {
      console.log(this.formatTopics(topics))
      console.log('')
    }

    if (commands.length > 0) {
      console.log(this.formatCommands(commands))
      console.log('')
    }
  }

  protected formatRoot(): string {
    const help = new RootHelp(this.config, this.opts)
    return help.root()
  }

  protected formatCommand(command: Config.Command): string {
    const help = new CommandHelp(command, this.config, this.opts)
    return help.generate()
  }

  protected formatCommands(commands: Config.Command[]): string {
    if (commands.length === 0) return ''

    const body = renderList(commands.map(c => [
      c.id,
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

  protected formatTopic(topic: Config.Topic): string {
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

  protected formatTopics(topics: Config.Topic[]): string {
    if (topics.length === 0) return ''
    const body = renderList(topics.map(c => [
      c.name,
      c.description && this.render(c.description.split('\n')[0]),
    ]), {
      spacer: '\n',
      stripAnsi: this.opts.stripAnsi,
      maxWidth: this.opts.maxWidth - 2,
    })
    return [
      bold('TOPICS'),
      indent(body, 2),
    ].join('\n')
  }

  /**
   * @arg {array} configTopics an array of topics from Config, which is a
   * mix of commands and topics
   * @returns {object} with properties `topics` and `commands`, each are
   * an array of the categorized based on the config topics given
   * @description config.topics are a list of commands and topics mixed.
   * For the purposes of this help plugin, it's important to categorize
   * which are categorized by a topic or a command. A topic has child
   * commands. A topic may also be a command. A command is "runnable".
   */
  protected categorizeTopicsAndCommands(configTopics: Config.Topic[]) {
    const commands: Config.Command[] = []
    const topics: Config.Topic[] = []

    configTopics.forEach((topic: Config.Topic) => {
      // if the current topic can find children that include the same name with a ":"
      // then it should have children, ie: "apps" has children if "apps:" exists in any
      // config topic like "apps:create"
      const hasChildren = Boolean(this.filteredTopics.find(t => t.name.startsWith(topic.name + ':')))
      if (hasChildren) {
        topics.push(topic)
      }

      const command = this.config.findCommand(topic.name)
      if (command) {
        commands.push(command)
      }
    })

    return {topics, commands}
  }
}
