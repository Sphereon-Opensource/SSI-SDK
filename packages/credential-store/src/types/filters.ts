import { CredentialRole, DigitalCredential, DocumentType, FindDigitalCredentialArgs } from '@sphereon/ssi-sdk.data-store'
import { validate as uuidValidate } from 'uuid'

/**
 * Creates a filter to find a digital credential by its ID or hash.
 *
 * @param credentialRole - The role to filter by (e.g., ISSUER, HOLDER).
 * @param idOrHash - The ID or hash of the credential to search for.
 * @returns A FindDigitalCredentialArgs array for filtering by ID or hash.
 */

export const credentialIdOrHashFilter = (credentialRole: CredentialRole, idOrHash: string): FindDigitalCredentialArgs => {
  const filter: FindDigitalCredentialArgs = [
    {
      hash: idOrHash,
      credentialRole,
    },
    {
      credentialId: idOrHash,
      credentialRole,
    },
  ]

  if (uuidValidate(idOrHash)) {
    filter.push({
      id: idOrHash,
      credentialRole,
    })
  }

  return filter
}

/**
 * Creates a filter for verifiable credentials with a specific role.
 *
 * @param credentialRole - The role to filter by (e.g., ISSUER, HOLDER).
 * @param withFilter - Optional additional filter criteria.
 * @returns A FindDigitalCredentialArgs array for filtering verifiable credentials by role.
 */
export const verifiableCredentialForRoleFilter = (
  credentialRole: CredentialRole,
  withFilter?: FindDigitalCredentialArgs,
): FindDigitalCredentialArgs => {
  const filter = [
    {
      documentType: DocumentType.VC,
      credentialRole: credentialRole,
    },
  ]
  if (withFilter !== undefined) {
    return mergeFilter(withFilter, filter)
  }
  return filter
}

/**
 * Merges two FindDigitalCredentialArgs arrays into a single array.
 *
 * This function combines two filter arrays, merging objects at the same index
 * and adding unique objects from both arrays. When merging objects, properties
 * from filter2 overwrite those from filter1 if they exist in both.
 *
 * @param filter1 - The first FindDigitalCredentialArgs array to merge.
 * @param filter2 - The second FindDigitalCredentialArgs array to merge.
 * @returns A new FindDigitalCredentialArgs array containing the merged result.
 *
 * @example
 * const filter1 = [{ documentType: DocumentType.VC }, { credentialRole: CredentialRole.ISSUER }];
 * const filter2 = [{ documentType: DocumentType.VP }, { hash: 'abc123' }];
 * const mergedFilter = mergeFilter(filter1, filter2);
 * // Result: [{ documentType: DocumentType.VP }, { credentialRole: CredentialRole.ISSUER, hash: 'abc123' }]
 */
export const mergeFilter = (filter1: FindDigitalCredentialArgs, filter2: FindDigitalCredentialArgs): FindDigitalCredentialArgs => {
  const mergedFilter: FindDigitalCredentialArgs = []

  const mergedMap = new Map<number, Partial<DigitalCredential>>()

  filter1.forEach((obj, index) => {
    mergedMap.set(index, { ...obj })
  })

  filter2.forEach((obj, index) => {
    if (mergedMap.has(index)) {
      mergedMap.set(index, { ...mergedMap.get(index), ...obj })
    } else {
      mergedMap.set(index, { ...obj })
    }
  })

  mergedMap.forEach((value) => {
    mergedFilter.push(value)
  })

  return mergedFilter
}
