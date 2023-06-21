import inquirer from 'inquirer'
import inquirerAutoPrompt from 'inquirer-autocomplete-prompt'

inquirer.registerPrompt('autocomplete', inquirerAutoPrompt)
import { sphereon } from './createCommand.js'

if (!process.argv.slice(2).length) {
  sphereon.outputHelp()
} else {
  sphereon.parse(process.argv)
}
