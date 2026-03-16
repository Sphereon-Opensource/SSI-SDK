import {
  CredentialDesign,
  GetCredentialDesignArgs,
  GetCredentialDesignsArgs,
  AddCredentialDesignArgs,
  UpdateCredentialDesignArgs,
  RemoveCredentialDesignArgs
} from '../types'

export abstract class AbstractCredentialDesignStore {
  abstract getOrCreateFormStepId(): Promise<string>
  abstract getCredentialDesign(args: GetCredentialDesignArgs): Promise<CredentialDesign>
  abstract getCredentialDesigns(args?: GetCredentialDesignsArgs): Promise<Array<CredentialDesign>>
  abstract addCredentialDesign(args: AddCredentialDesignArgs): Promise<CredentialDesign>
  abstract updateCredentialDesign(args: UpdateCredentialDesignArgs): Promise<CredentialDesign>
  abstract removeCredentialDesign(args: RemoveCredentialDesignArgs): Promise<void>
}
