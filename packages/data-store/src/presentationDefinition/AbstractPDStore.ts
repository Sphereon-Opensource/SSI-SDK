import {
  GetDefinitionArgs,
  GetDefinitionsArgs,
  DeleteDefinitionArgs,
  PresentationDefinitionItem,
  AddDefinitionArgs,
  UpdateDefinitionArgs,
} from '../types'

export abstract class AbstractPDStore {
  abstract getDefinition(args: GetDefinitionArgs): Promise<PresentationDefinitionItem>
  abstract getDefinitions(args: GetDefinitionsArgs): Promise<Array<PresentationDefinitionItem>>
  abstract addDefinition(args: AddDefinitionArgs): Promise<PresentationDefinitionItem>
  abstract updateDefinition(args: UpdateDefinitionArgs): Promise<PresentationDefinitionItem>
  abstract deleteDefinition(args: DeleteDefinitionArgs): Promise<void>
}
