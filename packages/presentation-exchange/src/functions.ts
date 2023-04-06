import {
  IIdentifierOpts,
  IPEXOptions,
  IPEXPresentationSignCallback,
  IRequiredContext,
} from './types/IPresentationExchange'
import { getAgentDIDMethods } from '@sphereon/ssi-sdk-did-utils'
import { IPresentationDefinition } from '@sphereon/pex'
import { IIdentifier, PresentationPayload } from '@veramo/core'
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

export function toDIDs(identifiers?: (string | IIdentifier | Partial<IIdentifier>)[]): string[] {
  if (!identifiers) {
    return []
  }
  return identifiers.map(toDID)
}

export function toDID(identifier: string | IIdentifier | Partial<IIdentifier>): string {
  if (typeof identifier === 'string') {
    return identifier
  }
  if (identifier.did) {
    return identifier.did
  }
  throw Error(`No DID value present in identifier`)
}

export function getDID(identifierOpts: IIdentifierOpts): string {
  if (typeof identifierOpts.identifier === 'string' || typeof identifierOpts.identifier === 'object') {
    return toDID(identifierOpts.identifier)
  }
  throw Error(`Cannot get DID from identifier value`)
}


export async function getIdentifier(identifierOpts: IIdentifierOpts, context: IRequiredContext): Promise<IIdentifier> {
  if (typeof identifierOpts.identifier === 'string') {
    return context.agent.didManagerGet({ did: identifierOpts.identifier })
  } else if (typeof identifierOpts.identifier === 'object') {
    return identifierOpts.identifier
  }
  throw Error(`Cannot get agent identifier value from options`)
}


export async function getSupportedDIDMethods(opts: { supportedDIDMethods?: string[] }, context: IRequiredContext) {
  return opts.supportedDIDMethods ?? (await getAgentDIDMethods(context))
}


export async function createPEXPresentationSignCallback({
                                                          kid,
                                                          fetchRemoteContexts,
                                                          domain,
                                                          challenge
                                                        }: {
  kid: string
  fetchRemoteContexts?: boolean
  domain?: string,
  challenge?: string,

}, context: IRequiredContext): Promise<IPEXPresentationSignCallback> {
  return async ({ presentation, domain, presentationDefinition, challenge }: {
    presentation: PresentationPayload, presentationDefinition: IPresentationDefinition, domain?: string
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

