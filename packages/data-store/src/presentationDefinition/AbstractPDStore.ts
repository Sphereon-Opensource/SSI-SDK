import {
  GetDefinitionArgs,
  GetDefinitionsArgs,
  DeleteDefinitionArgs,
  PresentationDefinitionItem,
  AddDefinitionArgs,
  UpdateDefinitionArgs,
  DeleteDefinitionsArgs,
} from '../types'

export abstract class AbstractPDStore {
  abstract hasDefinition(args: GetDefinitionArgs): Promise<boolean>
  abstract hasDefinitions(args: GetDefinitionsArgs): Promise<boolean>
  abstract getDefinition(args: GetDefinitionArgs): Promise<PresentationDefinitionItem>
  abstract getDefinitions(args: GetDefinitionsArgs): Promise<Array<PresentationDefinitionItem>>
  abstract addDefinition(args: AddDefinitionArgs): Promise<PresentationDefinitionItem>
  abstract updateDefinition(args: UpdateDefinitionArgs): Promise<PresentationDefinitionItem>
  abstract deleteDefinition(args: DeleteDefinitionArgs): Promise<void>
  abstract deleteDefinitions(args: DeleteDefinitionsArgs): Promise<number>
}
