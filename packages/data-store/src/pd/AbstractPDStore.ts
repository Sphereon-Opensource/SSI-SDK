import { GetGetDefinitionArgs, GetDefinitionsArgs, DeleteDefinitionArgs } from '../types/pd/IAbstractPDStore'
import { NonPersistedPresentationDefinitionItem, PresentationDefinitionItem } from '../types'

export abstract class AbstractPdStore {
  abstract getDefinition(args: GetGetDefinitionArgs): Promise<PresentationDefinitionItem>
  abstract getDefinitions(args: GetDefinitionsArgs): Promise<Array<PresentationDefinitionItem>>
  abstract addDefinition(args: NonPersistedPresentationDefinitionItem): Promise<PresentationDefinitionItem>
  abstract updateDefinition(args: PresentationDefinitionItem): Promise<PresentationDefinitionItem>
  abstract deleteDefinition(args: DeleteDefinitionArgs): Promise<void>
}
