/**
 * Bitstring Status List Implementation
 *
 * This module implements the W3C Bitstring Status List specification for managing
 * credential status information. It provides functionality to create, update, and
 * check the status of verifiable credentials using compressed bitstring status lists.
 *
 * Key features:
 * - Create new bitstring status lists with configurable purposes and bit sizes
 * - Update individual credential status entries in existing lists
 * - Check the status of specific credentials by index
 * - Support for multiple proof formats (JWT, LDS, CBOR)
 * - Integration with Veramo agent context for credential signing
 *
 * @author Sphereon International B.V.
 * @since 2024
 */

import type { IAgentContext } from '@veramo/core'
import type { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'

import {
  CredentialMapper,
  type CredentialProofFormat,
  DocumentFormat,
  type IIssuer,
  type StatusListCredential,
  StatusListType,
} from '@sphereon/ssi-types'

import type { IBitstringStatusListImplementationResult, IExtractedCredentialDetails, IStatusList } from './IStatusList'
import {
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  IMergeDetailsWithEntityArgs,
  IToDetailsFromCredentialArgs,
  StatusListResult,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from '../types'

import { assertValidProofType, ensureDate, getAssertedProperty, getAssertedValue, getAssertedValues } from '../utils'
import { BitstringStatusListCredential } from '../types/BitstringStatusList'
import {
  BitstreamStatusList,
  BitstringStatusListCredentialUnsigned,
  BitstringStatusPurpose,
  createStatusListCredential,
} from '@4sure-tech/vc-bitstring-status-lists'
import {
  BitstringStatusListEntity,
  BitstringStatusListEntryCredentialStatus,
  IBitstringStatusListEntryEntity,
  IStatusListEntryEntity,
  StatusListEntity,
} from '@sphereon/ssi-sdk.data-store'
import { IVcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'

export const DEFAULT_LIST_LENGTH = 131072 // W3C spec minimum
export const DEFAULT_PROOF_FORMAT = 'vc+jwt' as CredentialProofFormat
export const DEFAULT_STATUS_PURPOSE: BitstringStatusPurpose = 'revocation'

/**
 * Implementation of the IStatusList interface for W3C Bitstring Status Lists
 *
 * This class handles the creation, updating, and verification of bitstring status lists
 * according to the W3C Bitstring Status List specification. It supports multiple
 * status purposes (revocation, suspension, etc.) and various proof formats.
 */
export class BitstringStatusListImplementation implements IStatusList {
  /**
   * Creates a new bitstring status list with the specified configuration
   *
   * @param args - Configuration for the new status list including issuer, purpose, and size
   * @param context - Veramo agent context for credential operations
   * @returns Promise resolving to the created status list details
   */
  async createNewStatusList(
    args: CreateStatusListArgs,
    context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    if (!args.bitstringStatusList) {
      throw new Error('BitstringStatusList options are required for type BitstringStatusList')
    }

    const length = args?.length ?? DEFAULT_LIST_LENGTH
    const proofFormat: CredentialProofFormat = args?.proofFormat ?? DEFAULT_PROOF_FORMAT
    assertValidProofType(StatusListType.BitstringStatusList, proofFormat)

    const { issuer, id } = args
    const correlationId = getAssertedValue('correlationId', args.correlationId)
    const { statusPurpose, bitsPerStatus, validFrom, validUntil, ttl } = args.bitstringStatusList

    const unsignedCredential: BitstringStatusListCredentialUnsigned = await createStatusListCredential({
      id,
      issuer,
      statusPurpose: statusPurpose ?? DEFAULT_STATUS_PURPOSE,
      validFrom: ensureDate(validFrom),
      validUntil: ensureDate(validUntil),
      ttl,
    })
    const statusListCredential = await this.createVerifiableCredential(
      {
        unsignedCredential,
        id,
        issuer,
        proofFormat,
        keyRef: args.keyRef,
      },
      context,
    )

    return {
      encodedList: unsignedCredential.credentialSubject.encodedList,
      statusListCredential,
      bitstringStatusList: {
        statusPurpose: statusPurpose ?? DEFAULT_STATUS_PURPOSE,
        ...(unsignedCredential.validFrom && { validFrom: new Date(unsignedCredential.validFrom) }),
        ...(unsignedCredential.validUntil && { validUntil: new Date(unsignedCredential.validUntil) }),
        ttl,
        bitsPerStatus,
      },
      length,
      type: StatusListType.BitstringStatusList,
      proofFormat,
      id,
      correlationId,
      issuer,
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  /**
   * Updates the status of a specific credential in an existing status list
   *
   * @param args - Update parameters including the status list credential, index, and new value
   * @param context - Veramo agent context for credential operations
   * @returns Promise resolving to the updated status list details
   */
  async updateStatusListIndex(
    args: UpdateStatusListIndexArgs,
    context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    if (!args.bitsPerStatus || args.bitsPerStatus < 1) {
      return Promise.reject(Error('bitsPerStatus must be set for bitstring status lists and must be 1 or higher. (updateStatusListIndex)'))
    }

    const credential = args.statusListCredential
    const uniform = CredentialMapper.toUniformCredential(credential)
    const { issuer, credentialSubject } = uniform
    const id = getAssertedValue('id', uniform.id)
    const origEncodedList = getAssertedProperty('encodedList', credentialSubject)

    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    const statusList: BitstreamStatusList = await BitstreamStatusList.decode({ encodedList: origEncodedList, statusSize: args.bitsPerStatus })
    const bitstringStatusId = args.value as number
    statusList.setStatus(index, bitstringStatusId)

    const proofFormat = CredentialMapper.detectDocumentType(credential) === DocumentFormat.JWT ? 'vc+jwt' : 'lds'

    const credSubject = Array.isArray(credentialSubject) ? credentialSubject[0] : credentialSubject

    const statusPurpose = getAssertedProperty('statusPurpose', credSubject)

    const validFrom = uniform.validFrom ? new Date(uniform.validFrom) : undefined
    const validUntil = uniform.validUntil ? new Date(uniform.validUntil) : undefined
    const ttl = credSubject.ttl

    const unsignedCredential: BitstringStatusListCredentialUnsigned = await createStatusListCredential({
      id,
      issuer,
      statusList,
      statusPurpose: statusPurpose ?? DEFAULT_STATUS_PURPOSE,
      validFrom: ensureDate(validFrom),
      validUntil: ensureDate(validUntil),
      ttl,
    })

    const updatedCredential = await this.createVerifiableCredential(
      {
        unsignedCredential,
        id,
        issuer,
        proofFormat,
        keyRef: args.keyRef,
      },
      context,
    )

    return {
      statusListCredential: updatedCredential,
      encodedList: unsignedCredential.credentialSubject.encodedList,
      bitstringStatusList: {
        statusPurpose,
        ...(unsignedCredential.validFrom && { validFrom: new Date(unsignedCredential.validFrom) }),
        ...(unsignedCredential.validUntil && { validUntil: new Date(unsignedCredential.validUntil) }),
        bitsPerStatus: args.bitsPerStatus,
        ttl,
      },
      length: statusList.getLength(),
      type: StatusListType.BitstringStatusList,
      proofFormat,
      id,
      issuer,
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  /**
   * Updates a status list by decoding an encoded list, modifying it, and re-encoding
   *
   * @param args - Update parameters including encoded list, index, and new value
   * @param context - Veramo agent context for credential operations
   * @returns Promise resolving to the updated status list details
   */
  async updateStatusListFromEncodedList(
    args: UpdateStatusListFromEncodedListArgs,
    context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult> {
    if (!args.bitstringStatusList) {
      throw new Error('bitstringStatusList options required for type BitstringStatusList')
    }

    if (args.bitstringStatusList.bitsPerStatus < 1) {
      return Promise.reject(Error('bitsPerStatus must be set for bitstring status lists and must be 1 or higher. (updateStatusListFromEncodedList)'))
    }

    const { statusPurpose, bitsPerStatus, ttl, validFrom, validUntil } = args.bitstringStatusList

    const proofFormat: CredentialProofFormat = args?.proofFormat ?? DEFAULT_PROOF_FORMAT
    assertValidProofType(StatusListType.BitstringStatusList, proofFormat)

    const { issuer, id } = getAssertedValues(args)
    const statusList: BitstreamStatusList = await BitstreamStatusList.decode({ encodedList: args.encodedList, statusSize: bitsPerStatus })
    const index = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    statusList.setStatus(index, args.value)

    const unsignedCredential: BitstringStatusListCredentialUnsigned = await createStatusListCredential({
      id,
      issuer,
      statusList,
      statusPurpose: statusPurpose ?? DEFAULT_STATUS_PURPOSE,
      validFrom: ensureDate(validFrom),
      validUntil: ensureDate(validUntil),
      ttl,
    })

    const credential = await this.createVerifiableCredential(
      {
        unsignedCredential,
        id,
        issuer,
        proofFormat,
        keyRef: args.keyRef,
      },
      context,
    )

    return {
      type: StatusListType.BitstringStatusList,
      statusListCredential: credential,
      encodedList: unsignedCredential.credentialSubject.encodedList,
      bitstringStatusList: {
        statusPurpose,
        bitsPerStatus,
        ...(unsignedCredential.validFrom && { validFrom: new Date(unsignedCredential.validFrom) }),
        ...(unsignedCredential.validUntil && { validUntil: new Date(unsignedCredential.validUntil) }),
        ttl,
      },
      length: statusList.getLength(),
      proofFormat: args.proofFormat ?? 'lds',
      id,
      issuer,
      statuslistContentType: this.buildContentType(proofFormat),
    }
  }

  /**
   * Checks the status of a specific credential by its index in the status list
   *
   * @param args - Check parameters including the status list credential and index
   * @returns Promise resolving to the status value at the specified index
   */
  async checkStatusIndex(args: CheckStatusIndexArgs): Promise<number> {
    if (!args.bitsPerStatus || args.bitsPerStatus < 1) {
      return Promise.reject(Error('bitsPerStatus must be set for bitstring status lists and must be 1 or higher. (checkStatusIndex)'))
    }

    const uniform = CredentialMapper.toUniformCredential(args.statusListCredential)
    const { credentialSubject } = uniform
    const encodedList = getAssertedProperty('encodedList', credentialSubject)

    const statusList = await BitstreamStatusList.decode({ encodedList, statusSize: args.bitsPerStatus })
    const numIndex = typeof args.statusListIndex === 'number' ? args.statusListIndex : parseInt(args.statusListIndex)
    if (statusList.getLength() <= numIndex) {
      throw new Error(`Status list index out of bounds, has ${statusList.getLength()} entries, requested ${numIndex}`)
    }
    return statusList.getStatus(numIndex)
  }

  async extractCredentialDetails(credential: StatusListCredential): Promise<IExtractedCredentialDetails> {
    const uniform = CredentialMapper.toUniformCredential(credential)
    const { issuer, credentialSubject } = uniform
    const subject = Array.isArray(credentialSubject) ? credentialSubject[0] : credentialSubject

    return {
      id: getAssertedValue('id', uniform.id),
      issuer,
      encodedList: getAssertedProperty('encodedList', subject),
    }
  }

  /**
   * Converts a status list credential payload to detailed status list information
   *
   * @param args - Conversion parameters including the status list payload
   * @returns Promise resolving to detailed status list information
   */
  // For CREATE and READ contexts
  async toStatusListDetails(args: IToDetailsFromCredentialArgs): Promise<StatusListResult & IBitstringStatusListImplementationResult>
  // For UPDATE contexts
  async toStatusListDetails(args: IMergeDetailsWithEntityArgs): Promise<StatusListResult & IBitstringStatusListImplementationResult>
  async toStatusListDetails(
    args: IToDetailsFromCredentialArgs | IMergeDetailsWithEntityArgs,
  ): Promise<StatusListResult & IBitstringStatusListImplementationResult> {
    if ('statusListCredential' in args) {
      // CREATE/READ context
      const { statusListCredential, bitsPerStatus, correlationId, driverType } = args
      if (!bitsPerStatus || bitsPerStatus < 1) {
        return Promise.reject(Error('bitsPerStatus must be set for bitstring status lists and must be 1 or higher'))
      }

      const uniform = CredentialMapper.toUniformCredential(statusListCredential)
      const { issuer, credentialSubject } = uniform
      const subject = Array.isArray(credentialSubject) ? credentialSubject[0] : credentialSubject

      const id = getAssertedValue('id', uniform.id)
      const encodedList = getAssertedProperty('encodedList', subject)
      const statusPurpose = getAssertedProperty('statusPurpose', subject)
      const validFrom = uniform.validFrom ? new Date(uniform.validFrom) : undefined
      const validUntil = uniform.validUntil ? new Date(uniform.validUntil) : undefined
      const ttl = subject.ttl
      const proofFormat: CredentialProofFormat = CredentialMapper.detectDocumentType(statusListCredential) === DocumentFormat.JWT ? 'vc+jwt' : 'lds'
      const statuslistLength = BitstreamStatusList.getStatusListLength(encodedList, bitsPerStatus)

      return {
        id,
        encodedList,
        issuer,
        type: StatusListType.BitstringStatusList,
        proofFormat,
        length: statuslistLength,
        statusListCredential,
        statuslistContentType: this.buildContentType(proofFormat),
        correlationId,
        driverType,
        statusPurpose,
        bitsPerStatus,
        ...(validFrom && { validFrom }),
        ...(validUntil && { validUntil }),
        ...(ttl && { ttl }),
        bitstringStatusList: {
          statusPurpose,
          bitsPerStatus,
          ...(validFrom && { validFrom }),
          ...(validUntil && { validUntil }),
          ...(ttl && { ttl }),
        },
      }
    } else {
      // UPDATE context
      const { extractedDetails, statusListEntity } = args
      const bitstringEntity = statusListEntity as BitstringStatusListEntity
      if (!bitstringEntity.bitsPerStatus) {
        return Promise.reject(Error('bitsPerStatus must be present for a bitstring status list'))
      }

      const proofFormat: CredentialProofFormat =
        CredentialMapper.detectDocumentType(statusListEntity.statusListCredential!) === DocumentFormat.JWT ? 'vc+jwt' : 'lds'
      const statuslistLength = BitstreamStatusList.getStatusListLength(extractedDetails.encodedList, bitstringEntity.bitsPerStatus)

      return {
        id: extractedDetails.id,
        encodedList: extractedDetails.encodedList,
        issuer: extractedDetails.issuer,
        type: StatusListType.BitstringStatusList,
        proofFormat,
        length: statuslistLength,
        statusListCredential: statusListEntity.statusListCredential!,
        statuslistContentType: this.buildContentType(proofFormat),
        correlationId: statusListEntity.correlationId,
        driverType: statusListEntity.driverType,
        statusPurpose: bitstringEntity.statusPurpose,
        bitsPerStatus: bitstringEntity.bitsPerStatus,
        ...(bitstringEntity.validFrom && { validFrom: bitstringEntity.validFrom }),
        ...(bitstringEntity.validUntil && { validUntil: bitstringEntity.validUntil }),
        ...(bitstringEntity.ttl && { ttl: bitstringEntity.ttl }),
        bitstringStatusList: {
          statusPurpose: bitstringEntity.statusPurpose,
          bitsPerStatus: bitstringEntity.bitsPerStatus,
          ...(bitstringEntity.validFrom && { validFrom: bitstringEntity.validFrom }),
          ...(bitstringEntity.validUntil && { validUntil: bitstringEntity.validUntil }),
          ...(bitstringEntity.ttl && { ttl: bitstringEntity.ttl }),
        },
      }
    }
  }

  /**
   * Creates a credential status entry for a specific credential in a status list
   *
   * @param args - Parameters including the status list, entry details, and index
   * @returns Promise resolving to the credential status entry
   */
  async createCredentialStatus(args: {
    statusList: StatusListEntity
    statusListEntry: IStatusListEntryEntity | IBitstringStatusListEntryEntity
    statusListIndex: number
  }): Promise<BitstringStatusListEntryCredentialStatus> {
    const { statusList, statusListEntry, statusListIndex } = args

    const bitstringStatusList = statusList as BitstringStatusListEntity
    const bitstringStatusListEntry = statusListEntry as IBitstringStatusListEntryEntity
    return {
      id: `${statusList.id}#${statusListIndex}`,
      type: 'BitstringStatusListEntry',
      statusPurpose: bitstringStatusListEntry.statusPurpose,
      statusListIndex: '' + statusListIndex,
      statusListCredential: statusList.id,
      bitsPerStatus: bitstringStatusList.bitsPerStatus,
      statusMessage: bitstringStatusListEntry.statusMessage,
      statusReference: bitstringStatusListEntry.statusReference,
    } satisfies BitstringStatusListEntryCredentialStatus
  }

  /**
   * Creates a signed verifiable credential from an unsigned status list credential
   *
   * @param args - Parameters including the unsigned credential and signing details
   * @param context - Veramo agent context for credential operations
   * @returns Promise resolving to the signed credential
   */
  private async createVerifiableCredential(
    args: {
      unsignedCredential: BitstringStatusListCredentialUnsigned
      id: string
      issuer: string | IIssuer
      proofFormat: CredentialProofFormat
      keyRef?: string
    },
    context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
  ): Promise<BitstringStatusListCredential> {
    const { unsignedCredential, issuer, proofFormat, keyRef } = args

    const identifier = await context.agent.identifierManagedGet({
      identifier: typeof issuer === 'string' ? issuer : issuer.id,
      vmRelationship: 'assertionMethod',
      offlineWhenNoDIDRegistered: true,
    })

    const verifiableCredential = await context.agent.createVerifiableCredential({
      credential: unsignedCredential,
      keyRef: keyRef ?? identifier.kmsKeyRef,
      proofFormat,
      fetchRemoteContexts: true,
    })

    return CredentialMapper.toWrappedVerifiableCredential(verifiableCredential as StatusListCredential).original as BitstringStatusListCredential
  }

  /**
   * Builds the appropriate content type string for a given proof format
   *
   * @param proofFormat - The proof format to build content type for
   * @returns The corresponding content type string
   */
  private buildContentType(proofFormat: CredentialProofFormat | undefined): string {
    switch (proofFormat) {
      case 'jwt':
        return 'application/statuslist+jwt'
      case 'cbor':
        return 'application/statuslist+cwt'
      case 'vc+jwt':
        return 'application/statuslist+vc+jwt'
      case 'lds':
        return 'application/statuslist+ld+json'
      default:
        throw Error(`Unsupported content type '${proofFormat}' for status lists`)
    }
  }
}
