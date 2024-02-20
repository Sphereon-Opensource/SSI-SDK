import { dereferenceDidKeysWithJwkSupport, getAgentResolver, getIdentifier, getKey, IIdentifierOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { IPEXOptions, IPEXPresentationSignCallback, IRequiredContext } from './types/IPresentationExchange'
import { IPresentationDefinition } from '@sphereon/pex'
import { PresentationPayload, ProofFormat } from '@veramo/core'
import { CredentialMapper, Optional, OriginalVerifiablePresentation, W3CVerifiablePresentation } from '@sphereon/ssi-types'
import { Format } from '@sphereon/pex-models'

export async function getPresentationDefinition(pexOptions?: IPEXOptions): Promise<IPresentationDefinition | undefined> {
  return pexOptions?.definition
  /*const store = await getPresentationDefinitionStore(pexOptions)
    return store && pexOptions?.definitionId ? store.get(pexOptions?.definitionId) : undefined*/
}

export async function createPEXPresentationSignCallback(
  args: {
    idOpts: IIdentifierOpts
    fetchRemoteContexts?: boolean
    format?: Format | ProofFormat
    domain?: string
    challenge?: string
  },
  context: IRequiredContext
): Promise<IPEXPresentationSignCallback> {
  function determineProofFormat({
    format,
    presentationDefinition,
  }: {
    format?: Format | 'jwt' | 'lds' | 'EthereumEip712Signature2021'
    presentationDefinition: IPresentationDefinition
  }) {
    let proofFormat: ProofFormat = 'jwt'
    const formatOptions = format ?? args.format ?? presentationDefinition.format
    if (formatOptions) {
      if (typeof formatOptions === 'object') {
        const formats = Object.keys(formatOptions).map((form) => (form.includes('ldp') ? 'lds' : 'jwt'))
        if (!formats.includes('jwt')) {
          proofFormat = 'lds'
        }
      } else {
        proofFormat = formatOptions
      }
    }
    return proofFormat
  }

  return async ({
    presentation,
    domain,
    presentationDefinition,
    format,
    challenge,
  }: {
    presentation: Optional<PresentationPayload, 'holder'>
    presentationDefinition: IPresentationDefinition
    format?: Format | ProofFormat
    domain?: string
    challenge?: string
  }): Promise<W3CVerifiablePresentation> => {
    const idOpts = args.idOpts
    const id = await getIdentifier(idOpts, context)
    if (typeof idOpts.identifier === 'string') {
      idOpts.identifier = id
    }
    if (!presentation.holder) {
      presentation.holder = id.did
    }
    const key = await getKey(id, 'authentication', context, idOpts.kid)
    const didResolution = await getAgentResolver(context).resolve(idOpts.identifier.did)
    const vms = await dereferenceDidKeysWithJwkSupport(didResolution.didDocument!, idOpts.verificationMethodSection ?? 'authentication', context)
    const vm = vms.find((vm) => vm.publicKeyHex === key.publicKeyHex)
    if (!vm) {
      throw Error(`Could not resolve DID document or match signing key to did ${idOpts.identifier.did}`)
    }

    const proofFormat = determineProofFormat({ format, presentationDefinition })
    let header
    if (!presentation.holder) {
      presentation.holder = id.did
    }
    if (proofFormat === 'jwt') {
      header = {
        kid: vm.id,
      }
      if (presentation.verifier || !presentation.aud) {
        presentation.aud = Array.isArray(presentation.verifier) ? presentation.verifier : presentation.verifier ?? domain ?? args.domain
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
      proofFormat,
      header,
    })
    console.log(`POST CREATE VP AGENT ${new Date().toString()}`)
    console.log(`PRE MAPPER AGENT ${new Date().toString()}`)
    // makes sure we extract an actual JWT from the internal representation in case it is a JWT
    return CredentialMapper.storedPresentationToOriginalFormat(vp as OriginalVerifiablePresentation)
  }
}
