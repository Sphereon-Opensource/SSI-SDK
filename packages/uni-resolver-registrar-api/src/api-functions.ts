import { DIDResolutionResult } from '@sphereon/did-uni-client'
import { getAgentDIDMethods, toDidDocument, toDidResolutionResult } from '@sphereon/ssi-sdk-ext.did-utils'
import { JwkKeyUse } from '@sphereon/ssi-sdk-ext.key-utils'
import { checkAuth, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-sdk.express-support'
import { parseDid } from '@sphereon/ssi-types'
import { IIdentifier } from '@veramo/core'
import { Request, Response, Router } from 'express'
import { v4 } from 'uuid'
import { CreateState, DidRegistrationCreateRequest, IRequiredContext } from './types'

export function createDidEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts & { kms?: string }) {
  if (opts?.enabled === false) {
    console.log(`create DID endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/identifiers'

  router.post(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const createRequest: DidRegistrationCreateRequest = request.body
      if (!createRequest) {
        return sendErrorResponse(response, 400, 'No DID create request present')
      }
      const did = createRequest.did
      const didMethod = (request.query.method as string) ?? (did ? parseDid(did).method : undefined)
      const allDidMethods = await getAgentDIDMethods(context)
      if (!didMethod) {
        return sendErrorResponse(response, 400, 'No DID method supplied or deductible')
      } else if (did && parseDid(did).method != didMethod) {
        return sendErrorResponse(response, 400, 'DID method did not match method param')
      } else if (!allDidMethods.includes(didMethod)) {
        return sendErrorResponse(response, 400, 'DID method not supported')
      }
      const provider = `did:${didMethod}`
      const jobId = createRequest.jobId ?? `urn:uuid:${v4()}`
      let alias: string | undefined = undefined
      if (didMethod === 'web') {
        if (!did) {
          throw Error('Please provide a value for "did" in the request body when creating a DID web')
        }
        alias = parseDid(did).id
        if (!alias) {
          throw Error('Could not determine alias from did:web DID value: ' + did)
        }
      }

      let identifier: IIdentifier
      if (createRequest.options.storeSecrets === false) {
        throw Error('Not storing secrets mode is not support yet')
        /*const memoryKMS = new SphereonKeyManager({
                    store: new MemoryKeyStore(),
                    kms: {'mem': new KeyManagementSystem(new MemoryPrivateKeyStore())}
                })
                identifier = await memoryKMS..didManagerCreate({provider, alias, kms: opts?.kms})*/
      } else {
        identifier = await context.agent.didManagerCreate({ provider, alias, kms: opts?.kms })
      }

      const didDocument = toDidDocument(identifier, { did, use: [JwkKeyUse.Signature, JwkKeyUse.Encryption] })
      const createState: CreateState = {
        jobId,
        didState: {
          did: identifier.did,
          state: 'finished',
          didDocument,
        },
      }
      response.statusCode = 200
      return response.send(createState)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function getDidMethodsEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Get DID methods endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/methods'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const methods = await getAgentDIDMethods(context) // these are already without the 'did:' prefix
      response.statusCode = 200
      return response.send(methods)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function resolveDidEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts & { mode?: 'local' | 'resolve' }) {
  if (opts?.enabled === false) {
    console.log(`Resolve DID endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/identifiers/:identifier'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const did = request.params.identifier
      if (!did) {
        return sendErrorResponse(response, 400, 'no identifier provided')
      }
      const mode = request.query.mode?.toString().toLowerCase() ?? opts?.mode?.toLowerCase()
      let resolutionResult: DIDResolutionResult | undefined
      if (mode === 'local' || mode === 'hybrid') {
        try {
          const identifier = await context.agent.didManagerGet({ did })
          console.log(JSON.stringify(identifier, null, 2))
          resolutionResult = toDidResolutionResult(identifier, {
            did,
            supportedMethod: await getAgentDIDMethods(context),
          })
        } catch (error) {
          resolutionResult = {
            didDocument: null,
            didResolutionMetadata: {
              error: 'notFound',
            },
            didDocumentMetadata: {},
          }
        }
      }
      if (mode !== 'local' && !resolutionResult?.didDocument) {
        resolutionResult = await context.agent.resolveDid({ didUrl: did })
      }

      response.statusCode = 200
      return response.send(resolutionResult)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function deactivateDidEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Deactivate DID endpoint is disabled`)
    return
  }
  router.delete(opts?.path ?? '/identifiers/:identifier', checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const did = request.params.identifier
      if (!did) {
        return sendErrorResponse(response, 400, 'no DID provided')
      }

      const result = await context.agent.didManagerDelete({ did })
      if (!result) {
        return sendErrorResponse(response, 404, `id ${did} not found`)
      }
      response.statusCode = 200
      return response.send()
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}
