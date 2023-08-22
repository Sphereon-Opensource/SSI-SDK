import bodyParser from "body-parser";
import cors from "cors";
import express, {Express} from "express";
// import {rpcHandler} from "typed-rpc/express";
import {EthersHeadlessProvider} from "./ethers-headless-provider";
import {Web3Method} from "./types";


export function createRpcServer(provider: EthersHeadlessProvider, opts?: {
    express?: Express,
    basePath?: string
}) {
    const app = opts?.express ?? express();
    app.use(express.json());
    app.use(cors())
    app.use(bodyParser.urlencoded({extended: true}));
    // app.post(opts?.basePath ?? "/web3/rpc", (req, res, next) => {console.log(`${JSON.stringify(req.body, null,2)}`); next()} , rpcHandler(createService(provider)));
    app.post(opts?.basePath ?? "/web3/rpc", (req, res, next) => {
        console.log(`REQ ${req.body.method}:\r\n${JSON.stringify(req.body, null, 2)}\r\n===`);
        next()
    }, async (req, res, next) => {
        try {
            const method = req.body.method
            const params = req.body.params
            const id = req.body.id
            const result = provider.request({method, params})
            provider.authorizeAll()
            const respBody = {id, jsonrpc: "2.0", result: await result}
            res.json(respBody)
            console.log(`RESPONSE for ${method}:\r\n${JSON.stringify(respBody, null, 2)}`)
        } catch (error) {
            console.log(error.message)
            let msg = error.message
            if (`body` in error) {
                msg = error.body
                res.json(error.body)
            } else {
                res.json({id: req.body.id, jsonrpc: "2.0", error: msg, code: error.code})
            }
            return next(msg)

        }
        next()
    });
    app.listen(3000);

}

export function createServiceMethod(method: string, service: Record<string, Function>, provider: EthersHeadlessProvider) {
    service[method] = async (params: any) => {
        // @ts-ignore
        const result = provider.request({method, params})

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
