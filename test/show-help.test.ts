import * as Config from '@oclif/config'
import {expect, test as base} from '@oclif/test'
import {stub, SinonStub} from 'sinon'
import * as path from 'path'

const g: any = global
g.columns = 80
import Help from '../src'

// extension makes previously protected methods public
class TestHelp extends Help {
  public showRootHelp(topics: Config.Topic[]) {
    return super.showRootHelp(topics)
  }

  public showTopicHelp(topic: Config.Topic, siblingTopics: Config.Topic[]) {
    return super.showTopicHelp(topic, siblingTopics)
  }
}

const test = base
.register('setupHelp', () => ({
  async run(ctx: { help: TestHelp; stubs: { [k: string]: SinonStub }}) {
    ctx.stubs = {
      showRootHelp: stub(TestHelp.prototype, 'showRootHelp').returns(),
      showTopicHelp: stub(TestHelp.prototype, 'showTopicHelp').returns(),
      showCommandHelp: stub(TestHelp.prototype, 'showCommandHelp').returns(),
    }

    // use devPlugins: true to bring in plugins-plugin with topic commands for testing
    const config = await Config.load({devPlugins: true, root: path.resolve(__dirname, '..')})
    ctx.help = new TestHelp(config)
  },
  finally(ctx) {
    Object.values(ctx.stubs).forEach(stub  => stub.restore())
  },
}))
.register('makeTopicsWithoutCommand', () => ({
  async run(ctx: {help: TestHelp; makeTopicOnlyStub: SinonStub}) {
    // by returning no matching command for a subject, it becomes a topic only
    // with no corresponding command (in which case the showCommandHelp is shown)
    ctx.makeTopicOnlyStub = stub(ctx.help.config, 'findCommand').returns(undefined)
  },
  finally(ctx) {
    ctx.makeTopicOnlyStub.restore()
  },
}))

describe('showHelp routing', () => {
  describe('shows root help', () => {
    test
    .setupHelp()
    .it('shows root help when no subject is provided', ({help, stubs}) => {
      help.showHelp([])
      expect(stubs.showRootHelp.called).to.be.true

      expect(stubs.showCommandHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })

    test
    .setupHelp()
    .it('shows root help when help is the only arg', ({help, stubs}) => {
      help.showHelp(['help'])
      expect(stubs.showRootHelp.called).to.be.true

      expect(stubs.showCommandHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })
  })

  describe('shows topic help', () => {
    test
    .setupHelp()
    .makeTopicsWithoutCommand()
    .it('shows the topic help when a topic has no matching command', ({help, stubs}) => {
      help.showHelp(['plugins'])
      expect(stubs.showTopicHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showCommandHelp.called).to.be.false
    })

    test
    .setupHelp()
    .makeTopicsWithoutCommand()
    .it('shows the topic help when a topic has no matching command and is preceded by help', ({help, stubs}) => {
      help.showHelp(['help', 'plugins'])
      expect(stubs.showTopicHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showCommandHelp.called).to.be.false
    })
  })

  describe('shows command help', () => {
    test
    .setupHelp()
    .it('calls showCommandHelp when a topic that is also a command is called', ({help, stubs}) => {
      help.showHelp(['plugins'])
      expect(stubs.showCommandHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })

    test
    .setupHelp()
    .it('calls showCommandHelp when a command is called', ({help, stubs}) => {
      help.showHelp(['plugins:install'])
      expect(stubs.showCommandHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })

    test
    .setupHelp()
    .it('calls showCommandHelp when a command is preceded by the help arg', ({help, stubs}) => {
      help.showHelp(['help', 'plugins:install'])
      expect(stubs.showCommandHelp.called).to.be.true

      expect(stubs.showRootHelp.called).to.be.false
      expect(stubs.showTopicHelp.called).to.be.false
    })
  })

  describe('errors', () => {
    test
    .setupHelp()
    .it('shows an error when there is a subject but it does not match a topic or command', ({help}) => {
      expect(() => help.showHelp(['meow'])).to.throw('command meow not found')
    })
  })
})
