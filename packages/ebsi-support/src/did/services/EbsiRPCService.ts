import { ApiOpts } from '../../types/IEbsiSupport'
import { GetDidDocumentParams, GetDidDocumentsParams, GetDidDocumentsResponse, JSON_RPC_VERSION, EbsiRPCResponse, RpcMethodArgs } from '../types'
import { DIDDocument } from 'did-resolver'
import { ebsiGetRegistryAPIUrls } from '../functions'
import fetch from 'cross-fetch'

/**
 * Allows to call 5 api methods of the EBSI RPC api
 * - insertDidDocument
 * - updateBaseDocument
 * - addVerificationMethod
 * - addVerificationMethodRelationship
 * - sendSignedTransaction
 * @function callRpcMethod
 * @param {{ params: RPCParams[]; id: number; token: string; method: EbsiRpcMethod; apiOpts? ApiOpts }} args
 */
export const callRpcMethod = async (args: RpcMethodArgs): Promise<EbsiRPCResponse> => {
  const { params, rpcId, bearerToken, rpcMethod, apiOpts } = args
  const options = buildFetchOptions({ bearerToken, params, rpcId, rpcMethod })
  return await (await fetch(ebsiGetRegistryAPIUrls({ ...apiOpts }).mutate, options)).json()
}

/**
 * Builds the request body of the http request to EBSI RPC api
 * @function buildFetchOptions
 * @param {{ params: RPCParams[]; id: number; token: string; method: EbsiRpcMethod }} args
 */
const buildFetchOptions = (args: RpcMethodArgs) => {
  const { params, rpcId, bearerToken, rpcMethod } = args
  return {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify({
      jsonrpc: JSON_RPC_VERSION,
      method: rpcMethod,
      params,
      id: rpcId,
    }),
  }
}

/**
 * Gets the DID document corresponding to the DID.
 * @param {{ params: GetDidDocumentParams, apiOpts?: ApiOpts }} args
 * @returns a did document
 */
export const getDidDocument = async (args: { params: GetDidDocumentParams; apiOpts?: ApiOpts }): Promise<DIDDocument> => {
  const { params, apiOpts } = args
  const { did, validAt } = params
  if (!did) {
    throw new Error('did parameter is required')
  }
  const query = validAt ? `?valid_at=${validAt}` : ''
  return await (await fetch(`${ebsiGetRegistryAPIUrls({ ...apiOpts }).query}/${did}${query}`)).json()
}

/**
 * listDidDocuments - Returns a list of identifiers.
 * @param {{ params: GetDidDocumentsParams; apiOpts?: ApiOpts }} args
 * @returns a list of identifiers
 */
export const listDidDocuments = async (args: { params: GetDidDocumentsParams; apiOpts?: ApiOpts }): Promise<GetDidDocumentsResponse> => {
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
