import { checkAuth, sendErrorResponse } from '@sphereon/ssi-express-support'
import {
  checkStatusIndexFromStatusListCredential,
  CreateNewStatusListFuncArgs,
  StatusListResult,
  updateStatusIndexFromStatusListCredential,
} from '@sphereon/ssi-sdk.vc-status-list'
import { getDriver } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import Debug from 'debug'
import { Request, Response, Router } from 'express'
import {
  ICredentialStatusListEndpointOpts,
  IRequiredContext,
  IW3CredentialStatusEndpointOpts,
  UpdateIndexedCredentialStatusRequest,
  UpdateW3cCredentialStatusRequest,
} from './types'
import { StatusListCredential, StatusListType } from '@sphereon/ssi-types'
import { IStatusListEntryEntity } from '@sphereon/ssi-sdk.data-store'

const debug = Debug('sphereon:ssi-sdk:status-list')

function sendStatuslistResponse(details: StatusListResult, statuslistPayload: StatusListCredential, response: Response) {
  let payload: Buffer | StatusListCredential

  switch (details.proofFormat) {
    case 'jwt':
    case 'cbor':
      payload = Buffer.from(statuslistPayload as string, 'ascii')
      break
    default:
      payload = statuslistPayload
  }

  return response.status(200).setHeader('Content-Type', details.statuslistContentType).send(payload)
}

export function createNewStatusListEndpoint(router: Router, context: IRequiredContext, opts: ICredentialStatusListEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Create new status list endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/status-lists'

  router.post(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      const statusListArgs: CreateNewStatusListFuncArgs = request.body.statusList
      if (!statusListArgs) {
        return sendErrorResponse(response, 400, 'No statusList details supplied')
      }
      const details = await context.agent.slCreateStatusList(statusListArgs)
      const statuslistPayload = details.statusListCredential
      return sendStatuslistResponse(details, statuslistPayload, response)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

const buildStatusListId = (request: Request): string => {
  const protocol = request.headers['x-forwarded-proto']?.toString() ?? request.protocol
  let host = request.headers['x-forwarded-host']?.toString() ?? request.get('host')
  const forwardedPort = request.headers['x-forwarded-port']?.toString()

  if (forwardedPort && !(protocol === 'https' && forwardedPort === '443') && !(protocol === 'http' && forwardedPort === '80')) {
    host += `:${forwardedPort}`
  }

  const forwardedPrefix = request.headers['x-forwarded-prefix']?.toString() ?? ''

  return `${protocol}://${host}${forwardedPrefix}${request.originalUrl.split('?')[0].replace(/\/status\/index\/.*/, '')}`
}

export function getStatusListCredentialEndpoint(router: Router, context: IRequiredContext, opts: ICredentialStatusListEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Get statusList credential endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/status-lists/:index'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      //todo: Check index against correlationId first. Then match originalUrl against statusList id
      //const correlationId = request.query.correlationId?.toString() ?? request.params.index?.toString() ?? request.originalUrl TODO I so not get these
      const correlationId = request.query.correlationId?.toString()
      const driver = await getDriver({
        ...(correlationId ? { correlationId } : { id: buildStatusListId(request) }),
        dbName: opts.dbName,
      })
      const details = await driver.getStatusList()
      const statuslistPayload = details.statusListCredential
      return sendStatuslistResponse(details, statuslistPayload, response)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function getStatusListCredentialIndexStatusEndpoint(router: Router, context: IRequiredContext, opts: ICredentialStatusListEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Get statusList credential index status endpoint is disabled`)
    return
  }
  const path = opts?.path ?? '/status-lists/:index/status/index/:statusListIndex'
  router.get(path, checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      //todo: Check index against correlationId first. Then match originalUrl against statusList id
      const statusListIndexStr = request.params.statusListIndex
      let statusListIndex: number
      try {
        statusListIndex = Number.parseInt(statusListIndexStr)
      } catch (error) {
        return sendErrorResponse(response, 400, `Please provide a proper statusListIndex`)
      }
      if (!statusListIndex || statusListIndex < 0) {
        return sendErrorResponse(response, 400, `Please provide a proper statusListIndex`)
      }
      //const correlationId = request.query.correlationId?.toString() ?? request.params.index?.toString() ?? request.originalUrl TODO I so not get these
      const statusListCorrelationId = request.query.correlationId?.toString()
      const driver = await getDriver({
        ...(statusListCorrelationId ? { correlationId: statusListCorrelationId } : { id: buildStatusListId(request) }),
        dbName: opts.dbName,
      })
      const details = await driver.getStatusList()
      if (statusListIndex > details.length) {
        return sendErrorResponse(response, 400, `Please provide a proper statusListIndex`)
      }

      const entityCorrelationId = request.query.entityCorrelationId?.toString()
      let entry = await driver.getStatusListEntryByIndex({
        statusListId: details.id,
        ...(entityCorrelationId ? { correlationId: entityCorrelationId } : { statusListIndex: statusListIndex }),
        errorOnNotFound: false,
      })
      const type = details.type === StatusListType.StatusList2021 ? 'StatusList2021Entry' : details.type
      const status = await checkStatusIndexFromStatusListCredential({
        statusListCredential: details.statusListCredential,
        ...(details.type === StatusListType.StatusList2021 ? { statusPurpose: details.statusList2021?.statusPurpose } : {}),
        type,
        id: details.id,
        statusListIndex,
      })
      if (!entry) {
        // The fact we have nothing on it means the status is okay
        entry = {
          statusList: details.id,
          value: '0',
          statusListIndex,
        }
      }
      response.statusCode = 200
      return response.send({ ...entry, status }) // FIXME content type?
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}

export function updateStatusEndpoint(router: Router, context: IRequiredContext, opts: IW3CredentialStatusEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Update credential status endpoint is disabled`)
    return
  }
  router.post(opts?.path ?? '/credentials/status', checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      debug(JSON.stringify(request.body, null, 2))
      const updateRequest = request.body as UpdateW3cCredentialStatusRequest | UpdateIndexedCredentialStatusRequest
      const statusListId = updateRequest.statusListId ?? request.query.statusListId?.toString() ?? opts.statusListId
      const statusListCorrelationId = updateRequest.statusListCorrelationId ?? request.query.statusListorrelationId?.toString() ?? opts.correlationId
      const entryCorrelationId = updateRequest.entryCorrelationId ?? request.query.entryCorrelationId?.toString()

      // TODO: Move mostly to driver
      if (!statusListId && !statusListCorrelationId) {
        return sendErrorResponse(response, 400, 'No statusList id or correlation Id provided or deduced for the API or in the request')
      } else if (!updateRequest.credentialStatus || updateRequest.credentialStatus.length === 0) {
        return sendErrorResponse(response, 400, 'No statusList updates supplied')
      }
      const driver = await getDriver({
        ...(statusListCorrelationId ? { correlationId: statusListCorrelationId } : { id: buildStatusListId(request) }),
        dbName: opts.dbName,
      })

      // Get status list entry based on request type
      let statusListEntry: IStatusListEntryEntity | undefined
      if ('credentialId' in updateRequest) {
        if (!updateRequest.credentialId) {
          return sendErrorResponse(response, 400, 'No credentialId supplied')
        }
        // unfortunately the W3C API works by credentialId. Which means you will have to map listIndices during issuance
        statusListEntry = await driver.getStatusListEntryByCredentialId({
          statusListId,
          statusListCorrelationId,
          entryCorrelationId,
          credentialId: updateRequest.credentialId,
          errorOnNotFound: true,
        })
      } else {
        if (!updateRequest.statusListIndex || updateRequest.statusListIndex < 0) {
          return sendErrorResponse(response, 400, 'Invalid statusListIndex supplied')
        }
        const driver = await getDriver({
          ...(statusListCorrelationId ? { statusListCorrelationId } : { id: buildStatusListId(request) }),
          dbName: opts.dbName,
        })
        const details = await driver.getStatusList()

        statusListEntry = await driver.getStatusListEntryByIndex({
          statusListId: details.id,
          ...(entryCorrelationId ? { correlationId: entryCorrelationId } : { statusListIndex: updateRequest.statusListIndex }),
          errorOnNotFound: true,
        })
      }

      if (!statusListEntry) {
        const identifier = 'credentialId' in updateRequest ? updateRequest.credentialId : `index ${updateRequest.statusListIndex}`
        return sendErrorResponse(response, 404, `Status list entry for ${identifier} not found for ${statusListId}`)
      }

      let details = await driver.getStatusList()
      let statusListCredential = details.statusListCredential

      for (const updateItem of updateRequest.credentialStatus) {
        if (!updateItem.status) {
          return sendErrorResponse(response, 400, `Required 'status' value was missing in the credentialStatus array`)
        }

        const value = updateItem.status === '0' || updateItem.status.toLowerCase() === 'false' ? '0' : '1'
        const statusList = statusListId ?? statusListEntry.statusList
        await driver.updateStatusListEntry({ ...statusListEntry, statusList, value })

        // todo: optimize. We are now creating a new VC for every item passed in. Probably wise to look at DB as well
        details = await updateStatusIndexFromStatusListCredential(
          {
            statusListCredential: statusListCredential,
            statusListIndex: statusListEntry.statusListIndex,
            value: parseInt(value),
            keyRef: opts.keyRef,
          },
          context,
        )
        details = await driver.updateStatusList({ statusListCredential: details.statusListCredential })
      }

      return sendStatuslistResponse(details, details.statusListCredential, response)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}
