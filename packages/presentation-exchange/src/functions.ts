import { dereferenceDidKeysWithJwkSupport, getAgentResolver, getIdentifier, getKey, IIdentifierOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { _NormalizedVerificationMethod } from '@veramo/utils'
import { IPEXPresentationSignCallback, IRequiredContext } from './types/IPresentationExchange'
import { IPresentationDefinition } from '@sphereon/pex'
import { IIdentifier, IKey, PresentationPayload, ProofFormat } from '@veramo/core'
import {
  CredentialMapper,
  Optional,
  OriginalVerifiablePresentation,
  SdJwtDecodedVerifiableCredential,
  W3CVerifiablePresentation,
} from '@sphereon/ssi-types'
import { Format } from '@sphereon/pex-models'

export async function createPEXPresentationSignCallback(
  args: {
    idOpts: IIdentifierOpts
    fetchRemoteContexts?: boolean
    skipDidResolution?: boolean
    format?: Format | ProofFormat
    domain?: string
    challenge?: string
  },
  context: IRequiredContext,
): Promise<IPEXPresentationSignCallback> {
  function determineProofFormat(args: {
    format?: Format | 'jwt' | 'lds' | 'EthereumEip712Signature2021'
    presentationDefinition: IPresentationDefinition
  }): string {
    const { format, presentationDefinition } = args

    // All format arguments are optional. So if no format has been given we go for SD-JWT
    const formatOptions = format ?? presentationDefinition.format
    if (!formatOptions) {
      return 'vc+sd-jwt'
    } else if (typeof formatOptions === 'string') {
      // if formatOptions is a singular string we can return that as the format
      return formatOptions
    }

    // here we transform all format options to either lds or jwt. but we also want to support sd-jwt, so we need to specifically check for this one. which is ['vc+sd-jwt']
    const formats = new Set(
      Object.keys(formatOptions).map((form) => (form.includes('ldp') ? 'lds' : form.includes('vc+sd-jwt') ? 'vc+sd-jwt' : 'jwt')),
    )

    // if we only have 1 format type we can return that
    if (formats.size === 1) {
      return formats.values().next().value
    }

    // if we can go for sd-jwt, we go for sd-jwt
    if (formats.has('vc+sd-jwt')) {
      return 'vc+sd-jwt'
    }
    // if it is not sd-jwt we would like to go for jwt
    else if (formats.has('jwt')) {
      return 'jwt'
    }

    // else we go for lds
    return 'lds'
  }

  return async ({
    presentation,
    domain,
    presentationDefinition,
    format,
    challenge,
  }: {
    presentation: Optional<PresentationPayload, 'holder'> | SdJwtDecodedVerifiableCredential
    presentationDefinition: IPresentationDefinition
    format?: Format | ProofFormat
    domain?: string
    challenge?: string
  }): Promise<W3CVerifiablePresentation> => {
    const proofFormat = determineProofFormat({ format, presentationDefinition })
    const idOpts = args.idOpts
    const id = await getIdentifier(idOpts, context)
    if (typeof idOpts.identifier === 'string') {
      idOpts.identifier = id
    }

    // We need to determine the keys. This will also be needed for SD-JWTs soon, so do this first
    let key: IKey | undefined

    if (args.skipDidResolution) {
      if (!idOpts.kmsKeyRef) {
        key = id.keys.find((key) => key.meta?.purpose?.includes(idOpts.verificationMethodSection ?? 'authentication') === true)
      }
      if (!key) {
        key = id.keys.find(
          (key) =>
            !idOpts.kmsKeyRef ||
            key.kid === idOpts.kmsKeyRef ||
            key.meta?.jwkThumbprint === idOpts.kmsKeyRef ||
            `${id.did}#${key.kid}` === idOpts.kmsKeyRef,
        )
      }
    } else {
      key = await getKey({ identifier: id, vmRelationship: 'authentication', kmsKeyRef: idOpts.kmsKeyRef }, context)
    }

    if (!key) {
      throw Error(`Could not determine key to use ${JSON.stringify(idOpts)}`)
    }
    let vm: _NormalizedVerificationMethod | undefined = undefined
    if (args.skipDidResolution !== true) {
      const didResolution = await getAgentResolver(context).resolve(idOpts.identifier.did)
      const vms = await dereferenceDidKeysWithJwkSupport(didResolution.didDocument!, idOpts.verificationMethodSection ?? 'authentication', context)
      vm = vms.find((vm) => vm.publicKeyHex === key.publicKeyHex)
      if (!vm) {
        throw Error(`Could not resolve DID document or match signing key to did ${idOpts.identifier.did}`)
      }
    }

    if ('compactSdJwtVc' in presentation) {
      if (proofFormat !== 'vc+sd-jwt') {
        return Promise.reject(Error(`presentation payload does not match proof format ${proofFormat}`))
      }

      const presentationResult = await context.agent.createSdJwtPresentation({
        presentation: presentation.compactSdJwtVc,
        kb: {
          payload: {
            iat: presentation.kbJwt.payload.iat,
            nonce: presentation.kbJwt.payload.nonce,
            aud: (<IIdentifier>args.idOpts.identifier).did.split('#')[0],
          },
        },
      })

      return CredentialMapper.storedPresentationToOriginalFormat(presentationResult.presentation as OriginalVerifiablePresentation)
    } else {
      if (proofFormat === 'vc+sd-jwt') {
        return Promise.reject(Error(`presentation payload does not match proof format ${proofFormat}`))
      }
      let header
      if (!presentation.holder) {
        presentation.holder = id.did
      }
      const kid = vm?.id ?? key.meta?.jwkThumbprint ?? key.kid
      if (proofFormat === 'jwt') {
        if (!vm) {
          return Promise.reject(Error(`Verification method was expected at this point for ${proofFormat}`))
        }
        header = {
          kid: kid.includes('#') ? kid : `${id.did}#${kid}`,
        }
        if (presentation.verifier || !presentation.aud) {
          presentation.aud = Array.isArray(presentation.verifier) ? presentation.verifier : (presentation.verifier ?? domain ?? args.domain)
          delete presentation.verifier
        }
        const CLOCK_SKEW = 120
        if (!presentation.nbf) {
          if (presentation.issuanceDate) {
            const converted = Date.parse(presentation.issuanceDate)
            if (!isNaN(converted)) {
              presentation.nbf = Math.floor(converted / 1000) // no skew here, as an explicit value was given
            }
          } else {
            presentation.nbf = Math.floor(Date.now() / 1000 - CLOCK_SKEW)
          }
        }

        if (!presentation.iat) {
          presentation.iat = presentation.nbf
        }

        if (!presentation.exp) {
          if (presentation.expirationDate) {
            const converted = Date.parse(presentation.expirationDate)
            if (!isNaN(converted)) {
              presentation.exp = Math.floor(converted / 1000) // no skew here as an explicit value w as given
            }
          } else {
            presentation.exp = presentation.nbf + 600 + CLOCK_SKEW
          }
        }

        if (!presentation.vp) {
          presentation.vp = {}
        }
        if (!presentation.sub) {
          presentation.sub = id.did
        }
        if (!presentation.vp.holder) {
          presentation.vp.holder = id.did
        }
      }

      // we ignore the alg / proof_format for now, as we already have the kid anyway at this point

      // todo: look for jwt_vc_json and remove types and @context

      const vp = await context.agent.createVerifiablePresentation({
        presentation: presentation as PresentationPayload,
        removeOriginalFields: false,
        keyRef: key.kid,
        // domain: domain ?? args.domain, // handled above, and did-jwt-vc creates an array even for 1 entry
        challenge: challenge ?? args.challenge,
        fetchRemoteContexts: args.fetchRemoteContexts !== false,
        proofFormat: proofFormat as ProofFormat,
        header,
      })

      // makes sure we extract an actual JWT from the internal representation in case it is a JWT
      return CredentialMapper.storedPresentationToOriginalFormat(vp as OriginalVerifiablePresentation)
    }
  }
}
