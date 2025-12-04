import {
  AddCredentialArgs,
  DigitalCredential,
  GetCredentialArgs,
  GetCredentialsArgs,
  GetCredentialsResponse,
  RemoveCredentialArgs,
  UpdateCredentialArgs,
  UpdateCredentialStateArgs,
} from '../types'

export abstract class AbstractDigitalCredentialStore {
  abstract getCredential(args: GetCredentialArgs): Promise<DigitalCredential>

  abstract getCredentials(args?: GetCredentialsArgs): Promise<GetCredentialsResponse>

  abstract addCredential(args: AddCredentialArgs): Promise<DigitalCredential>

  abstract updateCredential(args: UpdateCredentialArgs): Promise<DigitalCredential>

  abstract updateCredentialState(args: UpdateCredentialStateArgs): Promise<DigitalCredential>

  abstract removeCredential(args: RemoveCredentialArgs): Promise<boolean>
}
