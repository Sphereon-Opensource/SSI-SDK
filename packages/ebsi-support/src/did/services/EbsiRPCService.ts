import {logger} from '@sphereon/ssi-sdk.public-key-hosting'
import fetch from 'cross-fetch'
import {ebsiGetRegistryAPIUrls} from '../functions'
import {EbsiRPCResponse, JSON_RPC_VERSION, RpcMethodArgs} from '../types'

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
  const { params, rpcId, accessToken, rpcMethod, apiOpts, doNotThrowErrors = false } = args
  const options = buildFetchOptions({ accessToken: accessToken, params, rpcId, rpcMethod })
  logger.debug(`RPC call:\r\n ${JSON.stringify(options, null, 2)}`)
  const rpcResponse = await (await fetch(ebsiGetRegistryAPIUrls({ ...apiOpts }).mutate, options)).json()

  let result = rpcResponse.result
  logger.debug(`RPC RESPONSE:\r\n${JSON.stringify(result ?? rpcResponse.error)}`)

  if (rpcResponse.error !== undefined && !doNotThrowErrors) {
    logger.error(`RPC ERROR RESPONSE:`, rpcResponse)
    throw Error(rpcResponse.error.message)
  }

  return rpcResponse
}

/**
 * Builds the request body of the http request to EBSI RPC api
 * @function buildFetchOptions
 * @param {{ params: RPCParams[]; id: number; token: string; method: EbsiRpcMethod }} args
 */
const buildFetchOptions = (args: RpcMethodArgs): RequestInit => {
  const { params, rpcId, accessToken, rpcMethod } = args
  const fetchReq = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      jsonrpc: JSON_RPC_VERSION,
      method: rpcMethod,
      params: params,
      id: rpcId,
    }),
  } satisfies RequestInit
  logger.debug(fetchReq)
  return fetchReq
}
