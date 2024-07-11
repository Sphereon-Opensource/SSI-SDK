import { IAgentPlugin } from '@veramo/core'
import {
  AddCredentialArgs,
  credentialIdOrHashFilter,
  DeleteCredentialArgs,
  DeleteCredentialsArgs,
  DocumentType,
  GetCredentialArgs,
  GetCredentialsArgs,
  GetCredentialsByClaimsArgs,
  GetCredentialsByIdOrHashArgs,
  ICredentialManager,
  OptionalUniqueDigitalCredential,
  schema,
  TClaimsColumns,
  UniqueDigitalCredential,
} from '../index'
import { DigitalCredential, UpdateCredentialStateArgs } from '@sphereon/ssi-sdk.data-store'
import { AbstractDigitalCredentialStore } from '@sphereon/ssi-sdk.data-store/dist/digitalCredential/AbstractDigitalCredentialStore'
import { IVerifiableCredential } from '@sphereon/ssi-types'

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
    crmGetUniqueCredentialByIdOrHash: this.crmGetUniqueCredentialByIdOrHash.bind(this),
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

  /** {@inheritDoc ICRManager.crmGetUniqueCredentialByIdOrHash} */
  private async crmGetUniqueCredentialByIdOrHash(args: GetCredentialsByIdOrHashArgs): Promise<OptionalUniqueDigitalCredential> {
    const credentials = await this.crmGetCredentials({ filter: credentialIdOrHashFilter(args.credentialRole, args.idOrHash) })
    if (credentials.length === 0) {
      return undefined
    }
    return this.toUniqueCredentials(credentials)[0]
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
    const digitalCredentials = await this.crmGetUniqueCredentials({
      filter: [
        {
          documentType: DocumentType.VC, // TODO does crmGetCredentialsByClaims need to support VPs as well?
          credentialRole: args.credentialRole,
          tenantId: args.tenantId,
        },
      ],
    })

    // TODO not sure if this is what we want, doing filtering now after credentials fetch because this data is inside the VC document
    const claimFilteredCredentials: UniqueDigitalCredential[] = digitalCredentials.filter((uniqueVC) => {
      if (!uniqueVC.uniformVerifiableCredential) {
        return false
      }

      let credential = uniqueVC.uniformVerifiableCredential

      // Handle JWT format before filtering
      if (typeof credential === 'string') {
        try {
          const decoded = JSON.parse(atob((credential as string).split('.')[1]))
          credential = decoded.vc as IVerifiableCredential
        } catch (e) {
          console.error('Error decoding JWT credential:', e)
          return false // Skip this credential if we can't decode it
        }
      }

      return (
        args.filter.where?.every((whereClause) => {
          const value = this.getValueFromCredential(credential, whereClause.column)

          if (value === undefined) {
            return whereClause.op === 'IsNull'
          }

          switch (whereClause.op) {
            case 'Equal':
              return value === whereClause.value?.[0]
            case 'In':
              return whereClause.value?.includes(value)
            case 'Like':
              return typeof value === 'string' && value.includes(whereClause.value?.[0] || '')
            case 'Between':
              return value >= (whereClause.value?.[0] || '') && value <= (whereClause.value?.[1] || '')
            case 'LessThan':
              return value < (whereClause.value?.[0] || '')
            case 'LessThanOrEqual':
              return value <= (whereClause.value?.[0] || '')
            case 'MoreThan':
              return value > (whereClause.value?.[0] || '')
            case 'MoreThanOrEqual':
              return value >= (whereClause.value?.[0] || '')
            case 'Any':
              return Array.isArray(value) && value.some((v) => whereClause.value?.includes(v))
            case 'IsNull':
              return value === null || value === undefined
            default:
              return true
          }
        }) ?? true
      )
    })

    return claimFilteredCredentials
  }

  private getValueFromCredential(credential: IVerifiableCredential, column: TClaimsColumns): any {
    switch (column) {
      case 'context':
        return credential['@context']
      case 'credentialType':
        return credential.type
      case 'type':
        return Array.isArray(credential.credentialSubject) ? credential.credentialSubject[0]?.type : credential.credentialSubject?.type
      case 'value':
        return JSON.stringify(credential.credentialSubject)
      case 'isObj':
        return typeof credential.credentialSubject === 'object'
      case 'id':
        return credential.id
      case 'issuer':
        return typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id
      case 'subject':
        return Array.isArray(credential.credentialSubject) ? credential.credentialSubject[0]?.id : credential.credentialSubject?.id
      case 'expirationDate':
        return credential.expirationDate
      case 'issuanceDate':
        return credential.issuanceDate
      default:
        return undefined
    }
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
          const uniqueCredential: UniqueDigitalCredential = {
            hash: credential.hash,
            digitalCredential: credential,
          }
          switch (credential.documentType) {
            case DocumentType.VC:
              uniqueCredential.originalVerifiableCredential = JSON.parse(credential.rawDocument)
              uniqueCredential.uniformVerifiableCredential = JSON.parse(credential.uniformDocument)
              break
            case DocumentType.VP:
              uniqueCredential.originalVerifiablePresentation = JSON.parse(credential.rawDocument)
              uniqueCredential.uniformVerifiablePresentation = JSON.parse(credential.uniformDocument)
              break
            case DocumentType.P:
              uniqueCredential.originalPresentation = JSON.parse(credential.rawDocument)
              break
            case DocumentType.C:
              uniqueCredential.originalCredential = JSON.parse(credential.rawDocument)
              break
            // TODO CBOR support
          }
          accumulator[credential.hash] = uniqueCredential
          return accumulator
        },
        {} as Record<string, UniqueDigitalCredential>,
      ),
    )
  }
}
