import {
  AddDigitalCredentialArgs,
  GetDigitalCredentialArgs,
  GetDigitalCredentialsArgs,
  GetDigitalCredentialsResponse,
  RemoveDigitalCredentialArgs,
  UpdateDigitalCredentialStateArgs,
} from '../types/digitalCredential/IAbstractDigitalCredentialStore'
import { DigitalCredentialEntity } from '../entities/digitalCredential/DigitalCredentialEntity'

export abstract class AbstractDigitalCredentialStore {
  abstract getDigitalCredential(args: GetDigitalCredentialArgs): Promise<DigitalCredentialEntity>
  abstract getDigitalCredentials(args?: GetDigitalCredentialsArgs): Promise<GetDigitalCredentialsResponse>
  abstract addDigitalCredential(args: AddDigitalCredentialArgs): Promise<DigitalCredentialEntity>
  abstract updateDigitalCredentialState(args: UpdateDigitalCredentialStateArgs): Promise<DigitalCredentialEntity>
  abstract removeDigitalCredential(args: RemoveDigitalCredentialArgs): Promise<boolean>
}
