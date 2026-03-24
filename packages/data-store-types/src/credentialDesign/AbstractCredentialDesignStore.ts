import {
  CredentialDesign,
  GetCredentialDesignArgs,
  GetCredentialDesignsArgs,
  CountCredentialDesignsArgs,
  FormStepGetOrCreateArgs,
  AddCredentialDesignArgs,
  UpdateCredentialDesignArgs,
  RemoveCredentialDesignArgs
} from '../types'

export abstract class AbstractCredentialDesignStore {
  abstract getCredentialDesign(args: GetCredentialDesignArgs): Promise<CredentialDesign>
  abstract getCredentialDesigns(args?: GetCredentialDesignsArgs): Promise<Array<CredentialDesign>>
  abstract countCredentialDesigns(args?: CountCredentialDesignsArgs): Promise<number>
  abstract addCredentialDesign(args: AddCredentialDesignArgs): Promise<CredentialDesign>
  abstract updateCredentialDesign(args: UpdateCredentialDesignArgs): Promise<CredentialDesign>
  abstract removeCredentialDesign(args: RemoveCredentialDesignArgs): Promise<void>
  abstract formStepGetOrCreate(args: FormStepGetOrCreateArgs): Promise<string>
}
