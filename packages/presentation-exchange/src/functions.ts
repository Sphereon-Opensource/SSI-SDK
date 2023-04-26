import { IPEXOptions, IPEXPresentationSignCallback, IRequiredContext } from './types/IPresentationExchange'
import { IPresentationDefinition } from '@sphereon/pex'
import { PresentationPayload } from '@veramo/core'
import { CredentialMapper, W3CVerifiablePresentation } from '@sphereon/ssi-types'
import { Format } from '@sphereon/pex-models'

export async function getPresentationDefinition(pexOptions?: IPEXOptions): Promise<IPresentationDefinition | undefined> {
  return pexOptions?.definition
  /*const store = await getPresentationDefinitionStore(pexOptions)
  return store && pexOptions?.definitionId ? store.get(pexOptions?.definitionId) : undefined*/
}

export async function createPEXPresentationSignCallback(
  {
    kid,
    fetchRemoteContexts,
    format,
    domain,
    challenge,
  }: {
    kid: string
    fetchRemoteContexts?: boolean
    format?: Format
    domain?: string
    challenge?: string
  },
  context: IRequiredContext,
): Promise<IPEXPresentationSignCallback> {
  return async ({
                  presentation,
                  domain,
                  presentationDefinition,
                  format,
                  challenge,
                }: {
    presentation: PresentationPayload
    presentationDefinition: IPresentationDefinition
    format?: Format
    domain?: string
    challenge?: string
  }): Promise<W3CVerifiablePresentation> => {
    const formatOptions = format ?? presentationDefinition.format
    const proofFormat = formatOptions && (!!formatOptions.ldp || !!formatOptions.ldp_vp) ? 'lds' : 'jwt'

    const vp = await context.agent.createVerifiablePresentation({
      presentation,
      keyRef: kid,
      domain,
      challenge,
      fetchRemoteContexts: fetchRemoteContexts !== undefined ? fetchRemoteContexts : true,
      proofFormat,
    })
    // makes sure we extract an actual JWT from the internal representation in case it is a JWT
    return CredentialMapper.storedPresentationToOriginalFormat(vp as W3CVerifiablePresentation)
  }
}
