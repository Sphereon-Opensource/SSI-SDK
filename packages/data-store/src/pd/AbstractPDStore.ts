import { GetPDArgs, GetPDsArgs, DeletePDArgs } from '../types/pd/IAbstractPDStore'
import { NonPersistedPresentationDefinitionItem, PresentationDefinitionItem } from '../types'

export abstract class AbstractPdStore {
  abstract getDefinition(args: GetPDArgs): Promise<PresentationDefinitionItem>
  abstract getDefinitions(args: GetPDsArgs): Promise<Array<PresentationDefinitionItem>>
  abstract addDefinition(args: NonPersistedPresentationDefinitionItem): Promise<PresentationDefinitionItem>
  abstract updateDefinition(args: PresentationDefinitionItem): Promise<PresentationDefinitionItem>
  abstract deleteDefinition(args: DeletePDArgs): Promise<void>
}
