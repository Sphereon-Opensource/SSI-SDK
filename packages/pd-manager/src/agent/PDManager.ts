import { IAgentPlugin } from '@veramo/core'
import { DeleteDefinitionArgs, GetDefinitionArgs, GetDefinitionsArgs, IPDManager, RequiredContext, schema, UpdateDefinitionArgs } from '../index'
import { NonPersistedPresentationDefinitionItem, PresentationDefinitionItem, AbstractPdStore } from '@sphereon/ssi-sdk.data-store'

// Exposing the methods here for any REST implementation
export const pdManagerMethods: Array<string> = [
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
    pdmGetDefinition: this.pdmGetDefinition.bind(this),
    pdmGetDefinitions: this.pdmGetDefinitions.bind(this),
    pdmAddDefinition: this.pdmAddDefinition.bind(this),
    pdmUpdateDefinition: this.pdmUpdateDefinition.bind(this),
    pdmDeleteDefinition: this.pdmDeleteDefinition.bind(this),
  }

  private readonly store: AbstractPdStore

  constructor(options: { store: AbstractPdStore }) {
    this.store = options.store
  }

  /** {@inheritDoc IPDManager.pdmGetDefinition} */
  private async pdmGetDefinition(args: GetDefinitionArgs, context: RequiredContext): Promise<PresentationDefinitionItem> {
    const { itemId } = args
    return this.store.getDefinition({ itemId })
  }

  /** {@inheritDoc IPDManager.pdmGetDefinitions} */
  private async pdmGetDefinitions(args: GetDefinitionsArgs, context: RequiredContext): Promise<Array<PresentationDefinitionItem>> {
    const { filter } = args
    return this.store.getDefinitions({ filter })
  }

  /** {@inheritDoc IPDManager.pdmAddDefinition} */
  private async pdmAddDefinition(args: NonPersistedPresentationDefinitionItem, context: RequiredContext): Promise<PresentationDefinitionItem> {
    return this.store.addDefinition(args)
  }

  /** {@inheritDoc IPDManager.pdmUpdateDefinition} */
  private async pdmUpdateDefinition(args: UpdateDefinitionArgs, context: RequiredContext): Promise<PresentationDefinitionItem> {
    return this.store.updateDefinition(args.definitionItem)
  }

  /** {@inheritDoc IPDManager.pdmDeleteDefinition} */
  private async pdmDeleteDefinition(args: DeleteDefinitionArgs): Promise<boolean> {
    return this.store.deleteDefinition(args).then((): boolean => true)
  }
}
