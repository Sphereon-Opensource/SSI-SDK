
import { IAgentPlugin } from '@veramo/core'
import {GetPDArgs, IPDManager, RequiredContext, schema} from '../index'
import {PresentationDefinitionItem} from "@sphereon/ssi-sdk.data-store";

// Exposing the methods here for any REST implementation
export const contactManagerMethods: Array<string> = [
  'pdmGetDefinition',
  'pdmGetDefinitions',
  'pdmAddDefinition',
  'pdmUpdateDefinition',
  'pdmRemoveDefinition',
]

/**
 * {@inheritDoc IPDManager}
 */
export class PDManager implements IAgentPlugin {
  readonly schema = schema.IPDManager
  readonly methods: IPDManager = {
    pdmGetDefinition: this.pdmGetDefinition.bind(this)
  }

  private readonly store: AbstractPDStore

  constructor(options: { store: AbstractPDStore }) {
    this.store = options.store
  }

  /** {@inheritDoc IPDManager.pdmGetDefinition} */
  private async pdmGetDefinition(args: GetPDArgs, context: RequiredContext): Promise<PresentationDefinitionItem> {
    const { contactId } = args
    return this.store.getParty({ partyId: contactId })
  }
}
