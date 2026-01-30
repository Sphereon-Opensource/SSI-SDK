import { checkAuth, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import {
  GeneratePresentationArgs,
  GetServiceEntriesArgs,
  HasLinkedVPEntryArgs,
  PublishCredentialArgs,
  UnpublishCredentialArgs,
} from '@sphereon/ssi-sdk.linked-vp'
import { DocumentFormat } from '@sphereon/ssi-types'
import { Request, Response, Router } from 'express'
import { IRequiredContext } from './types'

const operation = '/linked-vp'

// Publish Management Endpoints
export function publishCredentialEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"publishCredentialEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? operation
  router.post(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const args = request.body as PublishCredentialArgs
      const entry = await context.agent.lvpPublishCredential(args)
      response.statusCode = 201
      return response.json(entry)
    } catch (error) {
      console.error(error)
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}

export function unpublishCredentialEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"unpublishCredentialEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? operation
  router.delete(`${path}/:linkedVpId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const linkedVpId = request.params.linkedVpId
      const result = await context.agent.lvpUnpublishCredential({ linkedVpId } as UnpublishCredentialArgs)
      response.statusCode = 200
      return response.json({ success: result })
    } catch (error) {
      return sendErrorResponse(response, 500, error.message, error)
    }
  })
}

export function hasEntryEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"hasEntryEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? operation
  router.get(`${path}/:linkedVpId/exists`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const linkedVpId = request.params.linkedVpId
      const result = await context.agent.lvpHasEntry({ linkedVpId } as HasLinkedVPEntryArgs)
      response.statusCode = 200
      return response.json({ exists: result })
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

// Service Entries Endpoint
export function getServiceEntriesEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"getServiceEntriesEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? `${operation}/service-entries`
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const tenantId = request.query.tenantId as string | undefined
      const entries = await context.agent.lvpGetServiceEntries({ tenantId } as GetServiceEntriesArgs)
      response.statusCode = 200
      return response.json(entries)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

// Generate Presentation Endpoint
export function generatePresentationEndpoint(router: Router, context: IRequiredContext, opts?: ISingleEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`"generatePresentationEndpoint" Endpoint is disabled`)
    return
  }
  const path = opts?.path ?? operation
  router.get(`${path}/:linkedVpId`, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const linkedVpId = request.params.linkedVpId
      const linkedVPPresentation = await context.agent.lvpGeneratePresentation({ linkedVpId } as GeneratePresentationArgs)
      response.statusCode = 200
      response.contentType(contentTypeFromDocumentFormat(linkedVPPresentation.documentFormat))
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${linkedVpId}${extensionFromDocumentFormat(linkedVPPresentation.documentFormat)}"`,
      )
      if (typeof linkedVPPresentation.presentationPayload === 'string') {
        return response.send(linkedVPPresentation.presentationPayload)
      }
      return response.json(linkedVPPresentation.presentationPayload)
    } catch (error) {
      return sendErrorResponse(response, 500, error.message as string, error)
    }
  })
}

const contentTypeFromDocumentFormat = (documentFormat: DocumentFormat): string => {
  switch (documentFormat) {
    case DocumentFormat.JSONLD:
      return 'application/vp+ld+json'

    case DocumentFormat.EIP712:
      return 'application/eip712+json'

    case DocumentFormat.SD_JWT_VC:
      return 'application/sd-jwt'

    case DocumentFormat.MSO_MDOC:
      return 'application/mso+cbor'

    case DocumentFormat.JWT:
      return 'application/jwt'
  }
}

const extensionFromDocumentFormat = (format: DocumentFormat): string => {
  switch (format) {
    case DocumentFormat.JSONLD:
      return '.jsonld'
    case DocumentFormat.EIP712:
      return '.eip712.json'
    case DocumentFormat.SD_JWT_VC:
      return '.sd-jwt'
    case DocumentFormat.MSO_MDOC:
      return '.cbor'
    case DocumentFormat.JWT:
      return '.jwt'
    default:
      return ''
  }
}
