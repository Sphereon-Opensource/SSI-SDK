import {TransactionRequest} from '@ethersproject/abstract-provider'
import {Deferrable} from '@ethersproject/properties'
import {IKey} from '@veramo/core'
import {Eip712Payload} from '@veramo/key-manager'
import {ethers, Signer, TypedDataDomain, TypedDataField} from 'ethers'
import {arrayify, defineReadOnly} from 'ethers/lib/utils'
import * as u8a from 'uint8arrays'
import {IRequiredContext, TypedDataSigner} from './types'

export class Web3KMSSignerBuilder {
  private context?: IRequiredContext
  private keyRef?: Pick<IKey, 'kid'>
  private provider?: ethers.providers.Provider

  withContext(context: IRequiredContext): this {
    this.context = context
    return this
  }

  withKid(kid: string): this {
    this.keyRef = { kid }
    return this
  }

  withKeyRef(keyRef: Pick<IKey, 'kid'> | string): this {
    if (typeof keyRef === 'string') {
      return this.withKid(keyRef)
    }

    this.keyRef = keyRef
    return this
  }

  withProvider(provider: ethers.providers.Provider): this {
    this.provider = provider
    return this
  }

  build() {
    if (!this.context) {
      throw Error('Agent context needs to be provided')
    }
    if (!this.keyRef) {
      throw Error('Keyref needs to be provided')
    }
    return new Web3KMSSigner({ context: this.context, keyRef: this.keyRef, provider: this.provider })
  }
}

/**
 * This is a Web3 signer that delegates back to the KMS for the actual signatures.
 * This means we do not expose private keys and can use any Secp256k1 key stored in the KMS if we want
 *
 * Be aware that the provided KeyRef needs to belong to the respective KMS, as it will use a lookup for the key in the KMS to sign
 */
export class Web3KMSSigner extends Signer implements TypedDataSigner {
  private readonly context: IRequiredContext;
  private readonly keyRef: Pick<IKey, 'kid'>

  constructor({ provider, context, keyRef }: { provider?: ethers.providers.Provider; context: IRequiredContext; keyRef: Pick<IKey, 'kid'> }) {
    super()
    // defineReadOnly(this, "address", address);
    defineReadOnly(this, 'provider', provider || undefined)
    this.context = context
    this.keyRef = keyRef
  }

  private async getKey(): Promise<IKey | undefined> {
    return await this.context.agent.keyManagerGet({kid: this.keyRef.kid})
  }

  async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {

    return this.context.agent.keyManagerSign({
      algorithm: 'eth_signTransaction',
      keyRef: this.keyRef.kid,
      // keyRef: this.keyRef,
      // @ts-ignore
      data: arrayify(serialize(transaction)),
    })
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    return this.context.agent.keyManagerSign({
      algorithm: 'eth_signMessage',
      keyRef: this.keyRef.kid,
      // @ts-ignore // KMS accepts uint8arrays but interface does not expose it
      data: typeof message === 'string' ? u8a.fromString(message) : message,
    })
  }

  async _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
    const jsonData: Partial<Eip712Payload> = {
      domain,
      types,
      message: value,
    }
    return this.context.agent.keyManagerSign({
      algorithm: 'eth_signTypedData',
      keyRef: this.keyRef.kid,
      // @ts-ignore // KMS accepts uint8arrays but interface does not expose it
      data: u8a.fromString(JSON.stringify(jsonData)),
    })
  }

  async getAddress(): Promise<string> {
    const publicKeyHex = await this.getKey().then(key => key?.publicKeyHex)
    if (!publicKeyHex) {
      throw Error(`Could not retrieve public hex key for ${this.keyRef}`)
    }
    const address = ethers.utils.computeAddress(`${(publicKeyHex.startsWith('0x') ? '': '0x')}${publicKeyHex}`)
    if (!address || !address.startsWith('0x')) {
      throw Error(`Invalid address ${address} public key for key ${publicKeyHex}`)
    }
    return address
  }

  connect(provider: ethers.providers.Provider): Signer {
    return new Web3KMSSigner({ provider, context: this.context, keyRef: this.keyRef })
  }
}
