import { IAgentPlugin } from '@veramo/core'
import {
  AddCredentialArgs,
  DeleteCredentialArgs,
  DeleteCredentialsArgs,
  GetCredentialArgs,
  GetCredentialsArgs,
  GetCredentialsByClaimsArgs,
  ICredentialManager,
  schema,
  UniqueDigitalCredential,
} from '../index'
import { DigitalCredential, UpdateCredentialStateArgs } from '@sphereon/ssi-sdk.data-store'
import { AbstractDigitalCredentialStore } from '@sphereon/ssi-sdk.data-store/dist/digitalCredential/AbstractDigitalCredentialStore'

// Exposing the methods here for any REST implementation
export const credentialManagerMethods: Array<string> = [
  'crmAddCredential',
  'crmUpdateCredentialState',
  'crmGetCredential',
  'crmGetCredentials',
  'crmStoreCredential',
  'crmDeleteCredential',
  'crmDeleteCredentials',
  'crmGetCredentialsByClaims',
  'crmGetCredentialsByClaimsCount',
]

/**
 * {@inheritDoc ICRManager}
 */
export class CredentialManager implements IAgentPlugin {
  readonly schema = schema.ICredentialManager
  readonly methods: ICredentialManager = {
    crmAddCredential: this.crmAddCredential.bind(this),
    crmUpdateCredentialState: this.crmUpdateCredentialState.bind(this),
    crmGetCredential: this.crmGetCredential.bind(this),
    crmGetCredentials: this.crmGetCredentials.bind(this),
    crmGetUniqueCredentials: this.crmGetUniqueCredentials.bind(this),
    crmDeleteCredential: this.crmDeleteCredential.bind(this),
    crmDeleteCredentials: this.crmDeleteCredentials.bind(this),
    crmGetCredentialsByClaims: this.crmGetCredentialsByClaims.bind(this),
    crmGetCredentialsByClaimsCount: this.crmGetCredentialsByClaimsCount.bind(this),
  }

  private readonly store: AbstractDigitalCredentialStore

  constructor(options: { store: AbstractDigitalCredentialStore }) {
    this.store = options.store
  }

  /** {@inheritDoc ICRManager.crmAddCredential} */
  private async crmAddCredential(args: AddCredentialArgs): Promise<DigitalCredential> {
    return await this.store.addCredential(args.credential)
  }

  /** {@inheritDoc ICRManager.updateCredentialState} */
  private async crmUpdateCredentialState(args: UpdateCredentialStateArgs): Promise<DigitalCredential> {
    return await this.store.updateCredentialState(args)
  }

  /** {@inheritDoc ICRManager.crmGetCredential} */
  private async crmGetCredential(args: GetCredentialArgs): Promise<DigitalCredential> {
    const { id } = args
    const credential = await this.store.getCredential({ id })
    return credential
  }

  /** {@inheritDoc ICRManager.crmGetCredentials} */
  private async crmGetCredentials(args: GetCredentialsArgs): Promise<Array<DigitalCredential>> {
    const { filter } = args
    const credentials = await this.store.getCredentials({ filter })
    return credentials.data
  }

  /** {@inheritDoc ICRManager.crmGetUniqueCredentials} */
  private async crmGetUniqueCredentials(args: GetCredentialsArgs): Promise<Array<UniqueDigitalCredential>> {
    const credentials = await this.crmGetCredentials(args)
    return this.toUniqueCredentials(credentials)
  }

  /** {@inheritDoc ICRManager.crmDeleteCredential} */
  private async crmDeleteCredential(args: DeleteCredentialArgs): Promise<boolean> {
    return this.store.removeCredential(args)
  }

  /** {@inheritDoc ICRManager.crmDeleteCredentials} */
  private async crmDeleteCredentials(args: DeleteCredentialsArgs): Promise<number> {
    const credentials = await this.crmGetCredentials(args)
    let count = 0
    for (const credential of credentials) {
      const result = await this.store.removeCredential({ id: credential.id })
      if (result) {
        count++
      }
    }
    return count
  }

  /**
   * Returns a list of UniqueDigitalCredentials that match the given filter based on the claims they contain.
   * @param args
   */
  private async crmGetCredentialsByClaims(args: GetCredentialsByClaimsArgs): Promise<Array<UniqueDigitalCredential>> {
    const digitalCredentials = await this.crmGetCredentials({
      filter: [
        {
          credentialRole: args.credentialRole,
          tenantId: args.tenantId,
        },
      ],
    })
    const claimFilteredCredentials = digitalCredentials.filter((credential) => {
      return true // FIXME BEFORE PR filter claims somehow
    })
    return this.toUniqueCredentials(claimFilteredCredentials)
  }

  /**
   * Returns a count of UniqueDigitalCredentials that match the given filter based on the claims they contain.
   * @param args
   */
  private async crmGetCredentialsByClaimsCount(args: GetCredentialsByClaimsArgs): Promise<number> {
    const credentialsByClaims = await this.crmGetCredentialsByClaims(args)
    return credentialsByClaims.length // FIXME ?
  }

  private toUniqueCredentials(credentials: Array<DigitalCredential>): Array<UniqueDigitalCredential> {
    return Object.values(
      credentials.reduce(
        (accumulator, credential) => {
          accumulator[credential.hash] = { hash: credential.hash, digitalCredential: credential }
          return accumulator
        },
        {} as Record<string, UniqueDigitalCredential>,
      ),
    )
  }
}
