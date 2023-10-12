import {expect, test} from '@oclif/test'
import {readFileSync} from 'node:fs'

const {version: VERSION} = JSON.parse(readFileSync('package.json', 'utf8'))
const UA = `@oclif/plugin-help/${VERSION} ${process.platform}-${process.arch} node-${process.version}`

describe('help command', () => {
  test
    .stdout()
    .command(['help', 'help'])
    .it('shows help command help', (ctx) => {
      expect(ctx.stdout).to.equal(`Standard help for oclif.

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]

COMMANDS
  help  Display help for oclif.

`)
    })

  test
    .stdout()
    .command(['help'])
    .it('shows root help', (ctx) => {
      expect(ctx.stdout).to.equal(`Standard help for oclif.

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]

COMMANDS
  help  Display help for oclif.

`)
    })
})
