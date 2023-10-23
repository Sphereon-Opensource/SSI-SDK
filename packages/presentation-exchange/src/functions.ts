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
    const key = await getKey(id, 'authentication', context, idOpts.kid)
    const didResolution = await getAgentResolver(context).resolve(idOpts.identifier.did)
    const vms = await dereferenceDidKeysWithJwkSupport(didResolution.didDocument!, idOpts.verificationMethodSection ?? 'authentication', context)
    const vm = vms.find((vm) => vm.publicKeyHex === key.publicKeyHex)
    if (!vm) {
      throw Error(`Could not resolve DID document or match signing key to did ${idOpts.identifier.did}`)
    }

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
    let header: undefined | object
    if (format === 'jwt') {
      header = {
        kid: vm.id,
      }
    }

    // we ignore the alg / proof_format for now, as we already have the kid anyway at this point

    // todo: look for jwt_vc_json and remove types and @context

    const vp = await context.agent.createVerifiablePresentation({
      presentation: presentation as PresentationPayload,
      removeOriginalFields: true,
      keyRef: key.kid,
      domain: domain ?? args.domain,
      challenge: challenge ?? args.challenge,
      fetchRemoteContexts: args.fetchRemoteContexts !== false,
      proofFormat,
      header,
    })
    // makes sure we extract an actual JWT from the internal representation in case it is a JWT
    return CredentialMapper.storedPresentationToOriginalFormat(vp as OriginalVerifiablePresentation)
  }
}
