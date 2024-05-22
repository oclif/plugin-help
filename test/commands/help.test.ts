import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {readFileSync} from 'node:fs'

const {version: VERSION} = JSON.parse(readFileSync('package.json', 'utf8'))
const UA = `@oclif/plugin-help/${VERSION} ${process.platform}-${process.arch} node-${process.version}`

describe('help command', () => {
  it('shows help command help', async () => {
    const {stdout} = await runCommand('help help')
    expect(stdout).to.equal(`Standard help for oclif.

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]

COMMANDS
  help  Display help for oclif.

`)
  })

  it('shows root help', async () => {
    const {stdout} = await runCommand('help')
    expect(stdout).to.equal(`Standard help for oclif.

VERSION
  ${UA}

USAGE
  $ oclif [COMMAND]

COMMANDS
  help  Display help for oclif.

`)
  })
})
