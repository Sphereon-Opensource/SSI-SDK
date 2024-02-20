import {
  AddCredentialArgs,
  GetCredentialArgs,
  GetCredentialsArgs,
  RemoveCredentialArgs,
  UpdateCredentialStateArgs,
} from '../types/credential/IAbstractCredentialStore'
import { UniformCredential } from '../types/credential/credential'

export abstract class AbstractCredentialStore {
  abstract getCredential(args: GetCredentialArgs): Promise<UniformCredential>
  abstract getCredentials(args?: GetCredentialsArgs): Promise<Array<UniformCredential>>
  abstract addCredential(args: AddCredentialArgs): Promise<UniformCredential>
  abstract updateCredentialState(args: UpdateCredentialStateArgs): Promise<UniformCredential>
  abstract removeCredential(args: RemoveCredentialArgs): Promise<void>
}
