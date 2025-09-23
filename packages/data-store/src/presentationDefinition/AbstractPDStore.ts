import type {
  GetDefinitionArgs,
  GetDefinitionsArgs,
  DeleteDefinitionArgs,
  DcqlQueryItem,
  AddDefinitionArgs,
  UpdateDefinitionArgs,
  DeleteDefinitionsArgs,
} from '../types'

export abstract class AbstractPDStore {
  abstract hasDefinition(args: GetDefinitionArgs): Promise<boolean>
  abstract hasDefinitions(args: GetDefinitionsArgs): Promise<boolean>
  abstract getDefinition(args: GetDefinitionArgs): Promise<DcqlQueryItem>
  abstract getDefinitions(args: GetDefinitionsArgs): Promise<Array<DcqlQueryItem>>
  abstract addDefinition(args: AddDefinitionArgs): Promise<DcqlQueryItem>
  abstract updateDefinition(args: UpdateDefinitionArgs): Promise<DcqlQueryItem>
  abstract deleteDefinition(args: DeleteDefinitionArgs): Promise<void>
  abstract deleteDefinitions(args: DeleteDefinitionsArgs): Promise<number>
}
