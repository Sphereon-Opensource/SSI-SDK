import { checkAuth, sendErrorResponse } from '@sphereon/ssi-express-support'
import {
  checkStatusIndexFromStatusListCredential,
  CreateNewStatusListFuncArgs,
  updateStatusIndexFromStatusListCredential,
} from '@sphereon/ssi-sdk.vc-status-list'
import { getDriver } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import Debug from 'debug'
import { Request, Response, Router } from 'express'
import { ICredentialStatusListEndpointOpts, IRequiredContext, IW3CredentialStatusEndpointOpts, UpdateCredentialStatusRequest } from './types'

const debug = Debug('sphereon:ssi-sdk:status-list')

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
      const statusListDetails = await context.agent.slCreateStatusList(statusListArgs)
      return response.send({ statusListDetails })
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

  return `${protocol}://${host}${request.originalUrl}`
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
      const correlationId = request.query.correlationId?.toString() ?? request.params.index?.toString() ?? request.originalUrl
      const driver = await getDriver({ id: buildStatusListId(request), correlationId, dbName: opts.dbName })
      const details = await driver.getStatusList()
      response.statusCode = 200
      return response.send(details.statusListCredential)
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
      const correlationId = request.query.correlationId?.toString() ?? request.params.index?.toString() ?? request.originalUrl
      const driver = await getDriver({
        id: `${request.protocol}://${request.get('host')}${request.originalUrl.replace(/\/status\/index\/.*/, '')}`,
        correlationId,
        dbName: opts.dbName,
      })
      const details = await driver.getStatusList()
      if (statusListIndex > details.length) {
        return sendErrorResponse(response, 400, `Please provide a proper statusListIndex`)
      }

      let entry = await driver.getStatusListEntryByIndex({
        statusListIndex,
        statusListId: details.id,
        correlationId: details.correlationId,
        errorOnNotFound: false,
      })
      const status = await checkStatusIndexFromStatusListCredential({ ...details, statusListIndex })
      if (!entry) {
        // The fact we have nothing on it means the status is okay
        entry = {
          statusList: details.id,
          value: '0',
          statusListIndex,
        }
      }
      response.statusCode = 200
      return response.send({ ...entry, status })
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}
export function updateW3CStatusEndpoint(router: Router, context: IRequiredContext, opts: IW3CredentialStatusEndpointOpts) {
  if (opts?.enabled === false) {
    console.log(`Update credential status endpoint is disabled`)
    return
  }
  router.post(opts?.path ?? '/credentials/status', checkAuth(opts?.endpoint), async (request: Request, response: Response) => {
    try {
      debug(JSON.stringify(request.body, null, 2))
      const updateRequest = request.body as UpdateCredentialStatusRequest
      const statusListId = updateRequest.statusListId ?? request.query.statusListId?.toString() ?? opts.statusListId
      const statusListCorrelationId = updateRequest.statusListCorrelationId ?? request.query.statusListorrelationId?.toString() ?? opts.correlationId
      const entryCorrelationId = updateRequest.entryCorrelationId ?? request.query.entryCorrelationId?.toString()
      const credentialId = updateRequest.credentialId

      // TODO: Move mostly to driver
      if (!credentialId) {
        return sendErrorResponse(response, 400, 'No statusList credentialId supplied')
      } else if (!updateRequest.credentialStatus || updateRequest.credentialStatus.length === 0) {
        return sendErrorResponse(response, 400, 'No statusList updates supplied')
      } else if (!statusListId && !statusListCorrelationId) {
        return sendErrorResponse(response, 400, 'No statusList id or correlation Id provided or deduced for the API or in the request')
      }
      const driver = await getDriver({ id: statusListId, correlationId: statusListCorrelationId, dbName: opts.dbName })
      // unfortunately the W3C API works by credentialId. Which means you will have to map listIndices during issuance
      const statusListEntry = await driver.getStatusListEntryByCredentialId({
        statusListId,
        statusListCorrelationId,
        entryCorrelationId,
        credentialId,
        errorOnNotFound: true,
      })
      if (!statusListEntry) {
        return sendErrorResponse(
          response,
          404,
          `status list index for credential id ${credentialId} was never recorded for ${statusListId}. This means the status will be 0`,
        )
      }
      const statusListIndex = statusListEntry.statusListIndex
      let details = await driver.getStatusList()
      let statusListCredential = details.statusListCredential

      for (const updateItem of updateRequest.credentialStatus) {
        if (updateItem.type && updateItem.type !== 'StatusList2021') {
          return sendErrorResponse(response, 400, `Only the optional type 'StatusList2021' is currently supported`)
        }

        if (!updateItem.status) {
          return sendErrorResponse(
            response,
            400,
            `Required 'status' value was missing in the credentialStatus array for credentialId ${credentialId}`,
          )
        }
        const value = updateItem.status === '0' || updateItem.status.toLowerCase() === 'false' ? false : true
        const statusList = statusListId ?? statusListEntry.statusList
        await driver.updateStatusListEntry({ ...statusListEntry, statusListIndex, statusList, credentialId, value: value ? '1' : '0' })

        // todo: optimize. We are now creating a new VC for every item passed in. Probably wise to look at DB as well
        details = await updateStatusIndexFromStatusListCredential({ statusListCredential, statusListIndex, value, keyRef: opts.keyRef }, context)
        details = await driver.updateStatusList({ statusListCredential: details.statusListCredential })
      }

      response.statusCode = 200
      return response.send(details.statusListCredential)
    } catch (e) {
      return sendErrorResponse(response, 500, e.message as string, e)
    }
  })
}
