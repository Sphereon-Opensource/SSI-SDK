import {AddPDArgs, GetPDArgs, GetPDsArgs, RemovePDArgs, UpdatePDArgs} from "../types/pd/IAbstractPDStore";
import {PresentationDefinitionItem} from "../types";

export abstract class AbstractPdStore {
  abstract getDefinition(args: GetPDArgs): Promise<PresentationDefinitionItem>
  abstract getDefinitions(args: GetPDsArgs): Promise<PresentationDefinitionItem>
  abstract addDefinition(args: AddPDArgs): Promise<PresentationDefinitionItem>
  abstract updateDefinition(args: UpdatePDArgs): Promise<PresentationDefinitionItem>
  abstract deleteDefinition(args: RemovePDArgs): Promise<boolean>
}