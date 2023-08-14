import {SphereonKeyManager} from "@sphereon/ssi-sdk-ext.key-manager";
import {SphereonKeyManagementSystem} from "@sphereon/ssi-sdk-ext.kms-local";
import {createAgent, IDIDManager, IKeyManager, IResolver, ManagedKeyInfo, TAgent} from "@veramo/core";
import {DIDManager, MemoryDIDStore} from "@veramo/did-manager";
import {getDidKeyResolver, KeyDIDProvider} from "@veramo/did-provider-key";
import {DIDResolverPlugin} from "@veramo/did-resolver";
import {MemoryKeyStore, MemoryPrivateKeyStore} from "@veramo/key-manager";
import {Resolver} from "did-resolver";
import {Signer} from 'ethers'
import {IRequiredContext, IWeb3Provider, Web3HeadlessProvider, Web3KMSSigner, Web3KMSSignerBuilder} from '../src'
import {injectWeb3Provider} from './web3-helper'

describe('Headless web3 provider', () => {
    let signers: Signer[]
    let web3Provider: IWeb3Provider
    let agent: TAgent<IKeyManager & IDIDManager & IResolver>
    let key: ManagedKeyInfo
    let kmsSigner: Web3KMSSigner

    beforeAll(async () => {
        agent = createAgent({
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
        key = await agent.keyManagerImport({
            privateKeyHex: '8f2695a99c416ab9241fc75ae53f90b083aecff9e4463e046a1527f456b502c6',
            kms: 'local',
            type: 'Secp256k1'
        })
        console.log("=============KEY===========")
        console.log(JSON.stringify(key))
        console.log("=============KEY===========")

        kmsSigner = new Web3KMSSignerBuilder().withContext(context).withKeyRef(key).build()
    })

    beforeEach(() => {
        // Inject window.ethereum instance
        [signers, web3Provider] = injectWeb3Provider({signers: [kmsSigner]})
    })

    it('renders user address after connecting', async () => {
        const headlessProvider = web3Provider as Web3HeadlessProvider
        expect(signers).toBeDefined()
        expect(await kmsSigner.getAddress()).toEqual('0x0c45D104d250B72301A7158fb27A8A4D4567b9Ce')

        const accountsPromise = web3Provider.request({method: 'eth_requestAccounts'})
        const chainIdPromise = web3Provider.request({method: 'eth_chainId'})
        headlessProvider.authorizeAll()
        const account = (await accountsPromise)[0]
        console.log(JSON.stringify(account))
        console.log(JSON.stringify(await chainIdPromise))

        const balance = await web3Provider.request({method: 'eth_getBalance', params: [account, 'latest']})

        console.log(JSON.stringify(await balance))
        console.log('DONE')
    }, 60000)
})
