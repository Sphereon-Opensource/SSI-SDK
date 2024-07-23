import fetch from 'cross-fetch'
import { DIDDocument } from 'did-resolver'
import { wait } from '../../functions'
import { logger } from '../../index'
import { ApiOpts } from '../../types/IEbsiSupport'
import { ebsiGetRegistryAPIUrls } from '../functions'
import { GetDidDocumentParams, GetDidDocumentsParams, GetDidDocumentsResponse } from '../types'

/**
 * Gets the DID document corresponding to the DID.
 * @param {{ params: GetDidDocumentParams, apiOpts?: ApiOpts }} args
 * @returns a did document
 */
export const ebsiGetDidDocument = async (args: { params: GetDidDocumentParams; apiOpts?: ApiOpts }): Promise<DIDDocument> => {
  const { params, apiOpts } = args
  const { did, validAt } = params
  if (!did) {
    throw new Error('did parameter is required')
  }
  const query = validAt ? `?valid_at=${validAt}` : ''
  const response = await fetch(`${ebsiGetRegistryAPIUrls({ ...apiOpts }).query}/${did}${query}`)
  const textBody = await response.text()
  const json = textBody.startsWith('{') ? JSON.parse(textBody) : undefined

  if (response.status >= 300 || !json) {
    return Promise.reject(new Error(json ?? textBody))
  }
  return json
}

/**
 * Wait up to the number of MS for a DID Document or Verification methods and relationships to be registered. This is needed, as the EBSI blockchain does not directly propagate across all nodes, since it needs to mine for consensus first
 * @param args
 */
export const ebsiWaitTillDocumentAnchored = async (
  args: GetDidDocumentParams &
    ApiOpts & {
      startIntervalMS?: number
      minIntervalMS?: number
      decreaseIntervalMSPerStep?: number
      maxWaitTime?: number
      searchForObject?: Record<string, any>
    },
): Promise<{
  totalWaitTime: number
  count: number
  didDocument: DIDDocument | undefined
}> => {
  const {
    did,
    startIntervalMS = 2000,
    minIntervalMS = 500,
    decreaseIntervalMSPerStep = 250,
    maxWaitTime = 60_000,
    version = 'v5',
    environment = 'pilot',
    searchForObject,
  } = args

  if (startIntervalMS < minIntervalMS) {
    return Promise.reject(Error(`min interval ${minIntervalMS} needs to be smaller or equal to the start interval ${startIntervalMS}`))
  } else if (decreaseIntervalMSPerStep < 0) {
    return Promise.reject(Error(`decrease interval per step ${decreaseIntervalMSPerStep} needs to be bigger than zero`))
  }
  let interval = startIntervalMS
  let totalWaitTime = 0
  let didDocument: DIDDocument | undefined
  let count = 0
  function logCalback() {
    logger.debug(`Get DID Document; count ${count}: wait time: ${totalWaitTime}, ${did}`)
  }
  while (!didDocument && totalWaitTime <= maxWaitTime) {
    ++count
    try {
      logCalback()
      didDocument = await ebsiGetDidDocument({ params: { did }, apiOpts: { environment, version } })
      if (searchForObject!! && didDocument) {
        const didDocAsStr = JSON.stringify(didDocument)
        const search = JSON.stringify(searchForObject)
        const found = didDocAsStr.includes(search.substring(1, search.length - 1))
        if (!found) {
          logger.debug(`We did not find VM relationship or key ${JSON.stringify(searchForObject)} in DID document ${did}`)
          didDocument = undefined
        }
      }
    } catch (e) {}
    if (!didDocument) {
      await wait(interval)
      totalWaitTime += interval
      interval = Math.max(interval - decreaseIntervalMSPerStep, minIntervalMS)
    }
  }
  logCalback()
  return { didDocument, totalWaitTime, count }
}

/**
 * listDidDocuments - Returns a list of identifiers.
 * @param {{ params: GetDidDocumentsParams; apiOpts?: ApiOpts }} args
 * @returns a list of identifiers
 */
export const ebsiListDidDocuments = async (args: { params: GetDidDocumentsParams; apiOpts?: ApiOpts }): Promise<GetDidDocumentsResponse> => {
  const { params, apiOpts } = args
  const { offset, size, controller } = params
  const queryParams: string[] = []
  if (offset) {
    queryParams.push(`page[after]=${offset}`)
  }
  if (size) {
    queryParams.push(`page[size]=${size}`)
  }
  if (controller) {
    queryParams.push(`controller=${controller}`)
  }
  const query = `?${queryParams.filter(Boolean).join('&')}`
  return await (await fetch(`${ebsiGetRegistryAPIUrls({ ...apiOpts }).query}/${query}`)).json()
}
