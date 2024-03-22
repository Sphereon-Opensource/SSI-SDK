import { ExpressBuilder, ExpressCorsConfigurer } from '@sphereon/ssi-express-support'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { createAgent, IDIDManager, IKeyManager, IResolver, ManagedKeyInfo, TAgent } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { Resolver } from 'did-resolver'
import { Signer } from 'ethers'
import { IRequiredContext, IWeb3Provider } from '../src'
import { EthersHeadlessProvider } from '../src'
import { EthersKMSSignerBuilder } from '../src'
import { createRpcServer } from '../src'
import { injectWeb3Provider } from './web3-helper'
import configJSON from './config.json'

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
        'did:key': new KeyDIDProvider({ defaultKms: 'local' }),
      },
      store: new MemoryDIDStore(),
      defaultProvider: 'did:key',
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...getDidKeyResolver(),
      }),
    }),
  ],
})
const context: IRequiredContext = { agent }

if (configJSON && Array.isArray(configJSON.configs)) {
  const configs = configJSON as Configs
  for (const config of configs.configs) {
    const expressSupport = ExpressBuilder.fromServerOpts({
      hostname: config.hostname ?? '127.0.0.1',
      port: config.port ?? 2999,
      basePath: config.basePath ?? '/web3/rpc',
    })
      .withCorsConfigurer(new ExpressCorsConfigurer().allowOrigin('*'))
      .build()
    const wallets = config.wallets
    if (!wallets || wallets.length === 0) {
      throw Error('Cannot have an RPC provider without wallets. Adjust the config')
    }
    const result = wallets.map((wallet) => {
      const privateKeys = wallet.privateKeys
      if (!privateKeys || privateKeys.length === 0) {
        throw Error('A wallet without private keys when setting up the headless RPC web3 wallet. Adjust the config')
      }
      const importedKeys = privateKeys.map((privateKeyHex) =>
        agent
          .keyManagerImport({
            // privateKeyHex: '8f2695a99c416ab9241fc75ae53f90b083aecff9e4463e046a1527f456b502c6',
            privateKeyHex,
            kms: 'local',
            type: 'Secp256k1',
          })
          .then((key) => {
            console.log(`Imported key ${JSON.stringify(key)}`)
            return key
          })
          .catch((e) => console.log(e)),
      )

      return Promise.all(importedKeys)
        .then((walletsKeys) => {
          console.log('=============KEY===========')
          console.log(JSON.stringify(walletsKeys))
          console.log('=============KEY===========')

          const kmsSigners = walletsKeys
            .filter((key) => key !== undefined)
            .map((key) =>
              new EthersKMSSignerBuilder()
                .withContext(context)
                .withKeyRef(key as ManagedKeyInfo)
                .build(),
            )
          let signers: Signer[]
          let web3Provider: IWeb3Provider

            // Inject window.ethereum instance
          ;[signers, web3Provider] = injectWeb3Provider({ signers: kmsSigners })
          const headlessProvider = web3Provider as EthersHeadlessProvider
          console.log(`NO Wallets: ${JSON.stringify(signers.length)}`)

          createRpcServer(headlessProvider, expressSupport, { path: wallet.path ?? '', basePath: config.basePath })
        })
        .then((value) => wallet)
    })

    Promise.all(result).then((walletConfig) => {
      expressSupport.start()
      console.log('Done setting up ' + config.basePath)
    })
  }
}

/*agent
    .keyManagerImport({
        // privateKeyHex: '8f2695a99c416ab9241fc75ae53f90b083aecff9e4463e046a1527f456b502c6',
        privateKeyHex: process.env.WEB3_IMPORT_PRIVATEKEY_HEX ?? 'f5c0438db93a60a191530c0dd61a118bfb26ce4afb1ee54ea67deb15ec92d164',
        kms: 'local',
        type: 'Secp256k1',
    })
    .then((key) => {
        console.log('=============KEY===========')
        console.log(JSON.stringify(key))
        console.log('=============KEY===========')
        const kmsSigner = new EthersKMSSignerBuilder().withContext(context).withKeyRef(key).build()
        let signers: Signer[]
        let web3Provider: IWeb3Provider

            // Inject window.ethereum instance
        ;[signers, web3Provider] = injectWeb3Provider({signers: [kmsSigner]})
        const headlessProvider = web3Provider as EthersHeadlessProvider
        console.log(`Signers: ${signers}`)
        const expressSupport = ExpressBuilder.fromServerOpts({
            hostname: '127.0.0.1',
            port: 2999,
            basePath: '/web3/rpc',
        })
            .withCorsConfigurer(new ExpressCorsConfigurer().allowOrigin('*'))
            .build()
        createRpcServer(headlessProvider, expressSupport)
        expressSupport.start()
    })
console.log('DONE')*/

export interface Configs {
  configs: Config[]
}

export interface Config {
  basePath?: string
  hostname?: string
  port?: number
  wallets: WalletConfig[]
}

export interface WalletConfig {
  privateKeys: string[]
  path?: string
}
