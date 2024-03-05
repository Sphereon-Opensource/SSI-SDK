import {
  AddCredentialArgs,
  GetCredentialArgs,
  GetCredentialsArgs,
  GetCredentialsResponse,
  RemoveCredentialArgs,
  UpdateCredentialStateArgs,
} from '../types/digitalCredential/IAbstractDigitalCredentialStore'
import { DigitalCredentialEntity } from '../entities/digitalCredential/DigitalCredentialEntity'

export abstract class AbstractDigitalCredentialStore {
  abstract getCredential(args: GetCredentialArgs): Promise<DigitalCredentialEntity>
  abstract getCredentials(args?: GetCredentialsArgs): Promise<GetCredentialsResponse>
  abstract addCredential(args: AddCredentialArgs): Promise<DigitalCredentialEntity>
  abstract updateCredentialState(args: UpdateCredentialStateArgs): Promise<DigitalCredentialEntity>
  abstract removeCredential(args: RemoveCredentialArgs): Promise<boolean>
}
