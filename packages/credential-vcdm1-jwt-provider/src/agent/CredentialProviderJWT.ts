import type { IAgentContext, IIdentifier, IKey, IKeyManager, IVerifyResult, VerifiableCredential, VerifierAgentContext } from '@veramo/core'
import {
  type ICanIssueCredentialTypeArgs,
  type ICanVerifyDocumentTypeArgs,
  type ICreateVerifiableCredentialLDArgs,
  type ICreateVerifiablePresentationLDArgs,
  type IVcdmCredentialProvider,
  type IVcdmIssuerAgentContext,
  IVerifyCredentialLDArgs,
  IVerifyPresentationLDArgs,
  pickSigningKey,
  preProcessCredentialPayload,
  preProcessPresentation,
} from '@sphereon/ssi-sdk.credential-vcdm'

import canonicalize from 'canonicalize'

import {
  createVerifiableCredentialJwt,
  createVerifiablePresentationJwt,
  normalizeCredential,
  normalizePresentation,
  verifyCredential as verifyCredentialJWT,
  verifyPresentation as verifyPresentationJWT,
  // @ts-ignore
} from 'did-jwt-vc'

import { type Resolvable } from 'did-resolver'

import { decodeJWT } from 'did-jwt'

import Debug from 'debug'
import { asArray, intersect, VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'
import { isVcdm1Credential } from '@sphereon/ssi-types'

const debug = Debug('sphereon:ssi-sdk:credential-jwt')

/**
 * A handler that implements the {@link IVcdmCredentialProvider} methods.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export class CredentialProviderJWT implements IVcdmCredentialProvider {
  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.matchKeyForType} */
  matchKeyForType(key: IKey): boolean {
    return this.matchKeyForJWT(key)
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.getTypeProofFormat} */
  getTypeProofFormat(): string {
    return 'jwt'
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.canIssueCredentialType} */
  canIssueCredentialType(args: ICanIssueCredentialTypeArgs): boolean {
    return args.proofFormat === 'jwt'
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.canVerifyDocumentType */
  canVerifyDocumentType(args: ICanVerifyDocumentTypeArgs): boolean {
    const { document } = args
    const jwt = typeof document === 'string' ? document : (<VerifiableCredential>document)?.proof?.jwt
    if (!jwt) {
      return false
    }
    const { payload } = decodeJWT(jwt)
    if ('vc' in payload) {
      return isVcdm1Credential(payload.vc)
    } else if ('vp' in payload) {
      return isVcdm1Credential(payload.vp)
    }
    return false
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.createVerifiableCredential} */
  async createVerifiableCredential(args: ICreateVerifiableCredentialLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiableCredentialSP> {
    let { keyRef, removeOriginalFields, ...otherOptions } = args

    const { credential, issuer } = preProcessCredentialPayload(args)
    let identifier: IIdentifier
    try {
      identifier = await context.agent.didManagerGet({ did: issuer })
    } catch (e) {
      throw new Error(`invalid_argument: ${credential.issuer} must be a DID managed by this agent. ${e}`)
    }

    const key = await pickSigningKey({ identifier, kmsKeyRef: keyRef }, context)

    debug('Signing VC with', identifier.did)
    let alg = 'ES256'
    if (key.type === 'Ed25519') {
      alg = 'EdDSA'
    } else if (key.type === 'Secp256k1') {
      alg = 'ES256K'
    }

    const signer = this.wrapSigner(context, key, alg)
    const jwt = await createVerifiableCredentialJwt(
      credential as any,
      { did: identifier.did, signer, alg, ...(key.meta.verificationMethod.id && { kid: key.meta.verificationMethod.id }) },
      { removeOriginalFields, ...otherOptions },
    )
    //FIXME: flagging this as a potential privacy leak.
    debug(jwt)
    return normalizeCredential(jwt)
  }

  /** {@inheritdoc ICredentialVerifier.verifyCredential} */
  async verifyCredential(args: IVerifyCredentialLDArgs, context: VerifierAgentContext): Promise<IVerifyResult> {
    let { credential, policies, ...otherOptions } = args
    let verifiedCredential: VerifiableCredential
    let verificationResult: IVerifyResult = { verified: false }
    let jwt: string = typeof credential === 'string' ? credential : asArray(credential.proof)[0].jwt
    let errorCode, message
    const resolver = {
      resolve: (didUrl: string) =>
        context.agent.resolveDid({
          didUrl,
          options: otherOptions?.resolutionOptions,
        }),
    } as Resolvable
    try {
      // needs broader credential as well to check equivalence with jwt
      verificationResult = await verifyCredentialJWT(jwt, resolver, {
        ...otherOptions,
        policies: {
          ...policies,
          nbf: policies?.nbf ?? policies?.issuanceDate,
          iat: policies?.iat ?? policies?.issuanceDate,
          exp: policies?.exp ?? policies?.expirationDate,
          aud: policies?.aud ?? policies?.audience,
        },
      })
      verifiedCredential = verificationResult.verifiableCredential

      // if credential was presented with other fields, make sure those fields match what's in the JWT
      if (typeof credential !== 'string' && asArray(credential.proof)[0].type === 'JwtProof2020') {
        const credentialCopy = JSON.parse(JSON.stringify(credential))
        delete credentialCopy.proof.jwt

        const verifiedCopy = JSON.parse(JSON.stringify(verifiedCredential))
        delete verifiedCopy.proof.jwt

        if (canonicalize(credentialCopy) !== canonicalize(verifiedCopy)) {
          verificationResult.verified = false
          verificationResult.error = new Error('invalid_credential: Credential JSON does not match JWT payload')
        }
      }
    } catch (e: any) {
      errorCode = e.errorCode
      message = e.message
    }
    if (verificationResult.verified) {
      return verificationResult
    }
    return {
      verified: false,
      error: {
        message,
        errorCode: errorCode ? errorCode : message?.split(':')[0],
      },
    }
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.createVerifiablePresentation} */
  async createVerifiablePresentation(args: ICreateVerifiablePresentationLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiablePresentationSP> {
    const { presentation, holder } = preProcessPresentation(args)
    let { domain, challenge, removeOriginalFields, keyRef, now, ...otherOptions } = args

    let identifier: IIdentifier
    try {
      identifier = await context.agent.didManagerGet({ did: holder })
    } catch (e) {
      throw new Error('invalid_argument: presentation.holder must be a DID managed by this agent')
    }
    const key = await pickSigningKey({ identifier, kmsKeyRef: keyRef }, context)

    debug('Signing VP with', identifier.did)
    let alg = 'ES256'
    if (key.type === 'Ed25519') {
      alg = 'EdDSA'
    } else if (key.type === 'Secp256k1') {
      alg = 'ES256K'
    }

    const signer = this.wrapSigner(context, key, alg)
    const jwt = await createVerifiablePresentationJwt(
      presentation as any,
      { did: identifier.did, signer, alg },
      { removeOriginalFields, challenge, domain, ...otherOptions },
    )
    //FIXME: flagging this as a potential privacy leak.
    debug(jwt)
    return normalizePresentation(jwt)
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.verifyPresentation} */
  async verifyPresentation(args: IVerifyPresentationLDArgs, context: VerifierAgentContext): Promise<IVerifyResult> {
    let { presentation, domain, challenge, fetchRemoteContexts, policies, ...otherOptions } = args
    let jwt: string
    if (typeof presentation === 'string') {
      jwt = presentation
    } else {
      jwt = asArray(presentation.proof)[0].jwt
    }
    const resolver = {
      resolve: (didUrl: string) =>
        context.agent.resolveDid({
          didUrl,
          options: otherOptions?.resolutionOptions,
        }),
    } as Resolvable

    let audience = domain
    if (!audience) {
      const { payload } = await decodeJWT(jwt)
      if (payload.aud) {
        // automatically add a managed DID as audience if one is found
        const intendedAudience = asArray(payload.aud)
        const managedDids = await context.agent.didManagerFind()
        const filtered = managedDids.filter((identifier) => intendedAudience.includes(identifier.did))
        if (filtered.length > 0) {
          audience = filtered[0].did
        }
      }
    }

    let message, errorCode
    try {
      const result = await verifyPresentationJWT(jwt, resolver, {
        challenge,
        domain,
        audience,
        policies: {
          ...policies,
          nbf: policies?.nbf ?? policies?.issuanceDate,
          iat: policies?.iat ?? policies?.issuanceDate,
          exp: policies?.exp ?? policies?.expirationDate,
          aud: policies?.aud ?? policies?.audience,
        },
        ...otherOptions,
      })
      if (result) {
        return {
          verified: true,
          verifiablePresentation: result,
        }
      }
    } catch (e: any) {
      message = e.message
      errorCode = e.errorCode
    }
    return {
      verified: false,
      error: {
        message,
        errorCode: errorCode ? errorCode : message?.split(':')[0],
      },
    }
  }

  /**
   * Checks if a key is suitable for signing JWT payloads.
   * @param key - the key to check
   * @param context - the Veramo agent context, unused here
   *
   * @beta
   */
  matchKeyForJWT(key: IKey): boolean {
    switch (key.type) {
      case 'Ed25519':
      case 'Secp256r1':
        return true
      case 'Secp256k1':
        return intersect(key.meta?.algorithms ?? [], ['ES256K', 'ES256K-R']).length > 0
      default:
        return false
    }
  }

  wrapSigner(context: IAgentContext<Pick<IKeyManager, 'keyManagerSign'>>, key: IKey, algorithm?: string) {
    return async (data: string | Uint8Array): Promise<string> => {
      const result = await context.agent.keyManagerSign({ keyRef: key.kid, data: <string>data, algorithm })
      return result
    }
  }
}
