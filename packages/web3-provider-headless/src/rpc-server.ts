import { ExpressSupport, ISingleEndpointOpts, sendErrorResponse } from '@sphereon/ssi-express-support'
import { Router } from 'express'
import { EthersHeadlessProvider } from './ethers-headless-provider'
import { Web3Method } from './types'

export function createRpcServer(
  provider: EthersHeadlessProvider,
  expressSupport: ExpressSupport,
  opts?: ISingleEndpointOpts & { basePath?: string },
) {
  const express = expressSupport.express
  const router = Router()
  // const app = expressSupport.express
  // app.post(opts?.basePath ?? "/web3/rpc", (req, res, next) => {console.log(`${JSON.stringify(req.body, null,2)}`); next()} , rpcHandler(createService(provider)));
  const path = opts?.path ?? '/web3/rpc'
  console.log(`RPC server will use basePath ${opts?.basePath ?? '/'} and path ${path}`)
  router.post(
    path,
    (req, res, next) => {
      console.log(`REQ ${req.body?.method}:\r\n${JSON.stringify(req.body, null, 2)}\r\n===`)
      next()
    },
    async (req, res, next) => {
      try {
        const method = req.body.method
        const params = req.body.params
        const id = req.body.id

        // todo: A Notification is a Request object without an "id" member.
        //  A Request object that is a Notification signifies the Client's lack of interest in the corresponding Response object,
        //  and as such no Response object needs to be returned to the client. The Server MUST NOT reply to a Notification, including those that are within a batch request.
        if (req.body.jsonrpc !== '2.0') {
          console.log('No valid JSON RPC call received', JSON.stringify(req.body))
          return sendErrorResponse(res, 200, {
            id: req.body.id,
            jsonrpc: '2.0',
            error: 'No valid JSON RPC call received. No jsonrp version supplied',
            code: -32600,
          })
        } else if (!id || !method) {
          console.log('No valid JSON RPC call received', JSON.stringify(req.body))
          return sendErrorResponse(res, 200, {
            id: req.body.id,
            jsonrpc: '2.0',
            error: 'No valid JSON RPC call received',
            code: -32600,
          })
        }
        const result = provider.request({ method, params })
        provider.authorizeAll()
        const respBody = { id, jsonrpc: '2.0', result: await result }
        res.json(respBody)
        console.log(`RESPONSE for ${method}:\r\n${JSON.stringify(respBody, null, 2)}`)
      } catch (error) {
        console.log(error.message)
        let msg = error.message
        if (`body` in error) {
          msg = error.body
          return sendErrorResponse(res, 200, msg)
          // res.json(error.body)
        } else {
          return sendErrorResponse(res, 200, {
            id: req.body.id,
            jsonrpc: '2.0',
            error: msg,
            code: error.code ?? -32000,
          })
        }
      }
      return next()
    },
  )
  express.use(opts?.basePath ?? '', router)
}

export function createServiceMethod(method: string, service: Record<string, Function>, provider: EthersHeadlessProvider) {
  service[method] = async (params: any) => {
    // @ts-ignore
    const result = provider.request({ method, params })

    provider.authorizeAll()
    return await result
  }
}

export function createService(provider: EthersHeadlessProvider) {
  const service = {}
  for (const method of Object.values(Web3Method)) {
    createServiceMethod(method, service, provider)
  }

  return service
}
