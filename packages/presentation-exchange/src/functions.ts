import { IPEXOptions, IPEXPresentationSignCallback, IRequiredContext } from './types/IPresentationExchange'
import { IPresentationDefinition } from '@sphereon/pex'
import { PresentationPayload } from '@veramo/core'
import { W3CVerifiablePresentation } from '@sphereon/ssi-types'

/*
export async function getPresentationDefinitionStore(pexOptions?: IPEXOptions): Promise<IKeyValueStore<IPresentationDefinition> | undefined> {
  if (pexOptions && pexOptions.definitionId) {
    if (!pexOptions.definitionStore) {
      // yes the assignment is ugly, but we want an in-memory fallback and it cannot be re-instantiated every time
      pexOptions.definitionStore = new KeyValueStore({
        namespace: 'definitions',
        store: new Map<string, IPresentationDefinition>(),
      })
    }
    return pexOptions.definitionStore
  }
  return undefined
}
*/

export async function getPresentationDefinition(pexOptions?: IPEXOptions): Promise<IPresentationDefinition | undefined> {
  return pexOptions?.definition
  /*const store = await getPresentationDefinitionStore(pexOptions)
  return store && pexOptions?.definitionId ? store.get(pexOptions?.definitionId) : undefined*/
}

export async function createPEXPresentationSignCallback(
  {
    kid,
    fetchRemoteContexts,
    domain,
    challenge,
  }: {
    kid: string
    fetchRemoteContexts?: boolean
    domain?: string
    challenge?: string
  },
  context: IRequiredContext
): Promise<IPEXPresentationSignCallback> {
  return async ({
    presentation,
    domain,
    presentationDefinition,
    challenge,
  }: {
    presentation: PresentationPayload
    presentationDefinition: IPresentationDefinition
    domain?: string
    challenge?: string
  }): Promise<W3CVerifiablePresentation> => {
    const format = presentationDefinition.format

    const vp = await context.agent.createVerifiablePresentation({
      presentation,
      keyRef: kid,
      domain,
      challenge,
      fetchRemoteContexts: fetchRemoteContexts !== undefined ? fetchRemoteContexts : true,
      proofFormat: format && (format.ldp || format.ldp_vp) ? 'lds' : 'jwt',
    })
    return vp as W3CVerifiablePresentation
  }
}
