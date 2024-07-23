import { DIDResolutionResult } from '@sphereon/did-uni-client'
import { getAgentDIDMethods, toDidDocument, toDidResolutionResult } from '@sphereon/ssi-sdk-ext.did-utils'
import { JwkKeyUse } from '@sphereon/ssi-sdk-ext.key-utils'
import { checkAuth, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import { parseDid } from '@sphereon/ssi-types'
import { IIdentifier } from '@veramo/core'
import { Request, Response, Router } from 'express'
import { v4 } from 'uuid'
import {
  CreateState,
  DidRegistrationCreateRequest,
  DidRegistrationDeactivateRequest,
  DidStateValue,
  ICreateDidEndpointOpts,
  IGlobalDidWebEndpointOpts,
  IRequiredContext,
  IResolveEndpointOpts,
} from './types'
import Debug from 'debug'

const debug = Debug('sphereon:ssi-sdk:uni-resolver-registrar')

export function createDidEndpoint(router: Router, context: IRequiredContext, opts?: ICreateDidEndpointOpts) {
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
      const didMethod = (request.query.method as string) ?? (did ? parseDid(did).method : opts?.defaultMethod)
      const allDidMethods = await getAgentDIDMethods(context)
      if (!didMethod) {
        return sendErrorResponse(response, 400, 'No DID method supplied or deductible')
      } else if (did && parseDid(did).method != didMethod) {
        return sendErrorResponse(response, 400, 'DID method did not match method param')
      } else if (!allDidMethods.includes(didMethod)) {
        return sendErrorResponse(response, 400, 'DID method not supported')
      }
      const provider = `did:${didMethod}`
      const jobId = createRequest.jobId ?? v4()
      let alias: string | undefined = undefined
      if (didMethod === 'web') {
        if (!did) {
          return sendErrorResponse(response, 400, 'Please provide a value for "did" in the request body when creating a DID web')
        }
        alias = parseDid(did).id
        if (!alias) {
          return sendErrorResponse(response, 400, 'Could not determine alias from did:web DID value: ' + did)
        }
      }

      let identifier: IIdentifier | undefined
      let state: DidStateValue | undefined
      if (opts?.noErrorOnExistingDid && did) {
        try {
          identifier = await context.agent.didManagerGet({ did })
          state = 'exists'
        } catch (e) {
          // Okay, since we will create a new one
        }
      }
      if (identifier === undefined) {
        if (createRequest.options.storeSecrets === false) {
          return sendErrorResponse(response, 400, 'Only storeSecrets mode is supported currently')
          /*const memoryKMS = new SphereonKeyManager({
                                store: new MemoryKeyStore(),
                                kms: {'mem': new KeyManagementSystem(new MemoryPrivateKeyStore())}
                            })
                            identifier = await memoryKMS..didManagerCreate({provider, alias, kms: opts?.kms})*/
        } else if (createRequest.options.storeSecrets || opts?.storeSecrets) {
          identifier = await context.agent.didManagerCreate({ provider, alias, kms: opts?.kms })
          state = 'finished'
        } else {
          return sendErrorResponse(response, 400, 'Only storeSecrets mode is supported currently')
        }
      }
      if (!identifier || !state) {
        return sendErrorResponse(response, 400, 'An identifier and did state should be present at this point')
      }

      const didDocument = toDidDocument(identifier, { did, use: [JwkKeyUse.Signature, JwkKeyUse.Encryption] })
      const createState: CreateState = {
        jobId,
        didState: {
          did: identifier.did,
          state,
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

async function agentDidToResolutionResult(context: IRequiredContext, did: string) {
  try {
    const identifier = await context.agent.didManagerGet({ did })
    debug(JSON.stringify(identifier, null, 2))
    return toDidResolutionResult(identifier, {
      did,
      supportedMethods: await getAgentDIDMethods(context),
    })
  } catch (error) {
    console.log(JSON.stringify(error.message))
    return {
      didDocument: null,
      didResolutionMetadata: {
        error: 'notFound',
      },
      didDocumentMetadata: {},
    }
  }
}

export function resolveDidEndpoint(router: Router, context: IRequiredContext, opts?: IResolveEndpointOpts) {
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
      const mode = request.query.mode?.toString().toLowerCase() ?? opts?.mode?.toLowerCase() ?? 'hybrid'
      let resolutionResult: DIDResolutionResult | undefined
      if (mode === 'local' || mode === 'hybrid') {
        resolutionResult = await agentDidToResolutionResult(context, did)
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

/**
 * @param router
 * @param context
 * @param opts
 */
export function deleteDidEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
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

export function deactivateDidEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log('Deactivate DID endpoint is disabled')
    return
  }

  router.post(opts?.path ?? '/deactivate', checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const deactivateRequest: DidRegistrationDeactivateRequest = request.body
      if (!deactivateRequest) {
        return sendErrorResponse(response, 400, 'Invalid request body', { state: 'failed' })
      }

      const { did, jobId = v4() } = deactivateRequest
      if (!did) {
        return sendErrorResponse(response, 400, 'No DID provided', { state: 'failed' })
      }

      const result = await context.agent.didManagerDelete({ did })
      if (!result) {
        return sendErrorResponse(response, 404, `DID ${did} not found`, { state: 'failed' })
      }

      response.status(200).json({
        state: 'finished',
        did,
        jobId,
      })
      return response.send()
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, { state: 'failed', errorDetails: e })
    }
  })
}

/**
 * Endpoint that eases DID web resolution, by mapping did-web paths to stored agent DIDs.
 *
 * Typically, you will have a reverse proxy or load balancer in front of this endpoint.
 *
 * Some examples of how did:web behaves:
 * did:web:example.com resolves to https://example.com/.well-known/did.json
 * did:web:example.com:sub:paths resolves to https://example.com/sub/paths/did.json
 *
 * This endpoint translate both forms by looking at the paths that end in /did.json.
 *
 * @param router
 * @param context
 * @param opts
 */
export function didWebDomainEndpoint(router: Router, context: IRequiredContext, opts?: IGlobalDidWebEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`DID Web domain resolution endpoint is disabled`)
    return
  }
  router.get(opts?.path ?? ':path(*)/did.json', checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const path = request.params.path
      if (!path || path.length === 0) {
        return sendErrorResponse(response, 404, 'Not found')
      }
      let did: string
      did = `did:web:${opts?.hostname?.replace('https://', '')?.replace('http://', '') ?? request.hostname}`
      if (path !== '/.well-known') {
        if (opts?.disableSubPaths) {
          return sendErrorResponse(response, 404, 'Not found')
        }
        const suffix = path.replace(/\//g, ':').replace(/%2F/g, ':')
        if (!suffix.startsWith(':')) {
          did += ':'
        }
        did += suffix
      } else if (opts?.disableWellKnown) {
        return sendErrorResponse(response, 404, 'Not found')
      }

      const resolutionResult = await agentDidToResolutionResult(context, did)
      if (!resolutionResult || !resolutionResult.didDocument || resolutionResult?.didResolutionMetadata?.error === 'notFound') {
        return sendErrorResponse(response, 404, 'Not found')
      }
      response.statusCode = 200
      return response.send(resolutionResult.didDocument)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}
