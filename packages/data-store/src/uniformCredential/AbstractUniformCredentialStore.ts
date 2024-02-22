import {
  AddUniformCredentialArgs,
  GetUniformCredentialArgs,
  GetUniformCredentialsArgs,
  RemoveUniformCredentialArgs,
  UpdateUniformCredentialStateArgs,
} from '../types/uniformCredential/IAbstractUniformCredentialStore'
import { UniformCredentialEntity } from '../entities/uniformCredential/UniformCredentialEntity'

export abstract class AbstractUniformCredentialStore {
  abstract getUniformCredential(args: GetUniformCredentialArgs): Promise<UniformCredentialEntity>
  abstract getUniformCredentials(args?: GetUniformCredentialsArgs): Promise<Array<UniformCredentialEntity>>
  abstract addUniformCredential(args: AddUniformCredentialArgs): Promise<UniformCredentialEntity>
  abstract updateUniformCredentialState(args: UpdateUniformCredentialStateArgs): Promise<UniformCredentialEntity>
  abstract removeUniformCredential(args: RemoveUniformCredentialArgs): Promise<boolean>
}
