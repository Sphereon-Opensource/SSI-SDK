import {ExpressBuilder, ExpressCorsConfigurer} from "@sphereon/ssi-express-support";
import {SphereonKeyManager} from "@sphereon/ssi-sdk-ext.key-manager";
import {SphereonKeyManagementSystem} from "@sphereon/ssi-sdk-ext.kms-local";
import {createAgent, IDIDManager, IKeyManager, IResolver, TAgent} from "@veramo/core";
import {DIDManager, MemoryDIDStore} from "@veramo/did-manager";
import {getDidKeyResolver, KeyDIDProvider} from "@veramo/did-provider-key";
import {DIDResolverPlugin} from "@veramo/did-resolver";
import {MemoryKeyStore, MemoryPrivateKeyStore} from "@veramo/key-manager";
import {Resolver} from "did-resolver";
import {Signer} from 'ethers'
import {IRequiredContext, IWeb3Provider} from '../src'
import {EthersHeadlessProvider} from "../src";
import {EthersKMSSignerBuilder} from "../src";
import {createRpcServer} from "../src";
import {injectWeb3Provider} from './web3-helper'


const agent: TAgent<IKeyManager & IDIDManager & IResolver> = createAgent({
    plugins: [
        new SphereonKeyManager({
            store: new MemoryKeyStore(),
            kms: {
                local: new SphereonKeyManagementSystem(new MemoryPrivateKeyStore()),
            },
        }),
        new DIDManager({
            providers: {
                'did:key': new KeyDIDProvider({defaultKms: 'local'}),
            },
            store: new MemoryDIDStore(),
            defaultProvider: 'did:key',
        }),
        new DIDResolverPlugin({
            resolver: new Resolver({
                ...getDidKeyResolver()
            }),
        }),
    ],
})
const context: IRequiredContext = {agent}
agent.keyManagerImport({
    // privateKeyHex: '8f2695a99c416ab9241fc75ae53f90b083aecff9e4463e046a1527f456b502c6',
    privateKeyHex: process.env.WEB3_IMPORT_PRIVATEKEY_HEX ?? 'f5c0438db93a60a191530c0dd61a118bfb26ce4afb1ee54ea67deb15ec92d164',
    kms: 'local',
    type: 'Secp256k1'
}).then(key => {
    console.log("=============KEY===========")
    console.log(JSON.stringify(key))
    console.log("=============KEY===========")
    const kmsSigner = new EthersKMSSignerBuilder().withContext(context).withKeyRef(key).build()
    let signers: Signer[]
    let web3Provider: IWeb3Provider

    // Inject window.ethereum instance
    [signers, web3Provider] = injectWeb3Provider({signers: [kmsSigner]})
    const headlessProvider = web3Provider as EthersHeadlessProvider
    console.log(`Signers: ${signers}`)
    const expressSupport = ExpressBuilder.fromServerOpts({
        hostname: "0.0.0.0",
        port: 3000,
        basePath: "/web3/rpc"
    }).withCorsConfigurer(new ExpressCorsConfigurer().allowOrigin("*")).build()
    createRpcServer(headlessProvider, expressSupport)
    expressSupport.start()
})
console.log('DONE')


