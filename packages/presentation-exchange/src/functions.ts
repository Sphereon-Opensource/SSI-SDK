import { dereferenceDidKeysWithJwkSupport, getAgentResolver, getIdentifier, getKey, IIdentifierOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { _NormalizedVerificationMethod } from '@veramo/utils'
import { IPEXPresentationSignCallback, IRequiredContext } from './types/IPresentationExchange'
import { IPresentationDefinition } from '@sphereon/pex'
import { IKey, PresentationPayload, ProofFormat } from '@veramo/core'
import { CredentialMapper, Optional, OriginalVerifiablePresentation, SdJwtDecodedVerifiableCredential, W3CVerifiablePresentation } from '@sphereon/ssi-types'
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
  function determineProofFormat(args: {format?: Format | 'jwt' | 'lds' | 'EthereumEip712Signature2021', presentationDefinition: IPresentationDefinition }): string {
    const {format, presentationDefinition } = args

    // All format arguments are optional. So if no format has been given we go for SD-JWT
    const formatOptions = format ?? presentationDefinition.format
    if (!formatOptions) {
      // TODO it was discussed that sd-jwt should be the new default. but since we mostly support jwt/lds i think we should not yet change the default if no options are given. since this will result in an error
      // TODO fix the new default once we have a better grip on the different flows.
      // return 'vc+sd-jwt'
      return 'jwt'
    }

    // if formatOptions is a singular string we can return that as the format
    if (typeof formatOptions === 'string') {
      return formatOptions
    }

    // here we transform all format options to either lds or jwt. but we also want to support sd-jwt, so we need to specifically check for this one. which is ['vc+sd-jwt']
    const formats = new Set(Object.keys(formatOptions).map((form) => (form.includes('ldp')
        ? 'lds'
        : form.includes('vc+sd-jwt')
          ? 'vc+sd-jwt'
          : 'jwt'
    )))

    // if we only have 1 format type we can return that
    if (formats.size === 1) {
      return formats.values().next().value
    }

    // if we can go for sd-jwt, we go for sd-jwt
    if (formats.has('vc+sd-jwt')) {
      return 'vc+sd-jwt'
    } else
      // if it is not sd-jwt we would like to go for jwt
    if (formats.has('jwt')) {
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
            aud: (<IIdentifier>args.idOpts.identifier).did.split('#0')[0]
          }
        }
      })

      return CredentialMapper.storedPresentationToOriginalFormat(presentationResult.presentation as OriginalVerifiablePresentation)
    } else {
      if (proofFormat === 'vc+sd-jwt') {
        return Promise.reject(Error(`presentation payload does not match proof format ${proofFormat}`))
      }

      const key = await getKey(id, 'authentication', context, idOpts.kid)
      if (!presentation.holder) {
        presentation.holder = id.did
      }

      // const key = await getKey(id, 'authentication', context, idOpts.kid)
      const didResolution = await getAgentResolver(context).resolve(idOpts.identifier.did)
      const vms = await dereferenceDidKeysWithJwkSupport(didResolution.didDocument!, idOpts.verificationMethodSection ?? 'authentication', context)
      const vm = vms.find((vm) => vm.publicKeyHex === key.publicKeyHex)
      if (!vm) {
        return Promise.reject(Error(`Could not resolve DID document or match signing key to did ${idOpts.identifier.did}`))
      }

      let header
      if (proofFormat === 'jwt') {
        header = {
          kid: vm.id,
        }
        if (presentation.verifier || !presentation.aud) {
          // TODO check external implementations if they like a single audience instead of an array
          presentation.aud = (Array.isArray(presentation.verifier) && presentation.verifier.length === 1) ? presentation.verifier[0] : presentation.verifier ?? domain ?? args.domain
          delete presentation.verifier
        }
        if (!presentation.nbf) {
          if (presentation.issuanceDate) {
            const converted = Date.parse(presentation.issuanceDate)
            if (!isNaN(converted)) {
              presentation.nbf = Math.floor(converted / 1000)
            }
          } else {
            presentation.nbf = Math.floor(Date.now() / 1000)
          }
        }

        if (!presentation.iat) {
          presentation.iat = presentation.nbf
        }

        if (!presentation.exp) {
          if (presentation.expirationDate) {
            const converted = Date.parse(presentation.expirationDate)
            if (!isNaN(converted)) {
              presentation.exp = Math.floor(converted / 1000)
            }
          } else {
            presentation.exp = presentation.nbf + 600
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

      console.log(`PRE CREATE VP AGENT ${new Date().toString()}`)
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
      console.log(`POST CREATE VP AGENT ${new Date().toString()}`)
      console.log(`PRE MAPPER AGENT ${new Date().toString()}`)

      // makes sure we extract an actual JWT from the internal representation in case it is a JWT
      return CredentialMapper.storedPresentationToOriginalFormat(vp as OriginalVerifiablePresentation)
    }
  }
}
