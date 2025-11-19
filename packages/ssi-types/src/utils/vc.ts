import type {
  ICredential,
  IVerifiableCredential,
  WrappedVerifiableCredential,
  WrappedVerifiablePresentation,
  WrappedW3CVerifiableCredential,
  WrappedW3CVerifiablePresentation,
} from '../types'
import type { CredentialPayload, VerifiableCredential } from '@veramo/core'

export function isWrappedW3CVerifiableCredential(vc: WrappedVerifiableCredential): vc is WrappedW3CVerifiableCredential {
  return vc.format === 'jwt_vc' || vc.format === 'ldp_vc'
}

export function isWrappedW3CVerifiablePresentation(vp: WrappedVerifiablePresentation): vp is WrappedW3CVerifiablePresentation {
  return vp.format === 'jwt_vp' || vp.format === 'ldp_vp'
}

export enum StatusListType {
  StatusList2021 = 'StatusList2021',
  OAuthStatusList = 'OAuthStatusList',
  BitstringStatusList = 'BitstringStatusList',
}

function isVcdmCredential(
  credential: CredentialPayload | IVerifiableCredential | ICredential | VerifiableCredential | unknown,
  vcdmType: string,
): boolean {
  if (!credential || typeof credential !== 'object') {
    return false
  } else if (!('@context' in credential && Array.isArray(credential['@context']))) {
    return false
  }
  return credential['@context'].includes(vcdmType)
}
export function isVcdm1Credential(credential: CredentialPayload | IVerifiableCredential | ICredential | VerifiableCredential | unknown): boolean {
  return isVcdmCredential(credential, VCDM_CREDENTIAL_CONTEXT_V1)
}

export function isVcdm2Credential(credential: CredentialPayload | IVerifiableCredential | ICredential | VerifiableCredential | unknown): boolean {
  return isVcdmCredential(credential, VCDM_CREDENTIAL_CONTEXT_V2)
}

export function addVcdmContextIfNeeded(context?: string[], defaultValue: string = VCDM_CREDENTIAL_CONTEXT_V2): string[] {
  const newContext = [...(context ?? [])]
  const vcdmContext = context?.find((val) => VCDM_CREDENTIAL_CONTEXT_VERSIONS.includes(val))
  if (!vcdmContext) {
    newContext.unshift(defaultValue)
  }
  return newContext
}

export const VCDM_CREDENTIAL_CONTEXT_V1 = 'https://www.w3.org/2018/credentials/v1'
export const VCDM_CREDENTIAL_CONTEXT_V2 = 'https://www.w3.org/ns/credentials/v2'
export const VCDM_CREDENTIAL_CONTEXT_VERSIONS = [VCDM_CREDENTIAL_CONTEXT_V2, VCDM_CREDENTIAL_CONTEXT_V1]
