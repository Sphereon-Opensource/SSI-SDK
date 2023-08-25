import { Provider, TransactionRequest } from '@ethersproject/abstract-provider'
import { Deferrable } from '@ethersproject/properties'
import { serialize } from '@ethersproject/transactions'
import { IKey } from '@veramo/core'
import { Eip712Payload } from '@veramo/key-manager'
import { ethers, Signer, TypedDataDomain, TypedDataField } from 'ethers'
// import {arrayify, defineReadOnly, serializeTransaction} from 'ethers/lib/utils'
import { arrayify, defineReadOnly /*, joinSignature*/ } from 'ethers/lib/utils'
import * as u8a from 'uint8arrays'
// import {ECDSASignature} from "web3-eth-accounts";
import { getAddressFromAgent } from './functions'
import { IRequiredContext, TypedDataSigner } from './types'

export class EthersKMSSignerBuilder {
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
    return new EthersKMSSigner({ context: this.context, keyRef: this.keyRef, provider: this.provider })
  }
}

/**
 * This is a Ethers signer that delegates back to the KMS for the actual signatures.
 * This means we do not expose private keys and can use any Secp256k1 key stored in the KMS if we want
 *
 * Be aware that the provided KeyRef needs to belong to the respective KMS, as it will use a lookup for the key in the KMS to sign
 */
export class EthersKMSSigner extends Signer implements TypedDataSigner {
  private readonly context: IRequiredContext
  private readonly keyRef: Pick<IKey, 'kid'>

  constructor({ provider, context, keyRef }: { provider?: ethers.providers.Provider; context: IRequiredContext; keyRef: Pick<IKey, 'kid'> }) {
    super()
    // defineReadOnly(this, "address", address);
    defineReadOnly(this, 'provider', provider || undefined)
    this.context = context
    this.keyRef = keyRef
  }

  async getAddress(): Promise<string> {
    return await getAddressFromAgent(this.context, this.keyRef)
  }
  async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    const { from, ...tx } = await transaction

    return this.context.agent.keyManagerSign({
      algorithm: 'eth_signTransaction',
      keyRef: this.keyRef.kid,
      // keyRef: this.keyRef,
      // @ts-ignore
      data: arrayify(serialize(tx)),
    })
  }

  async signRaw(message: string | Uint8Array): Promise<string> {
    return await this.context.agent.keyManagerSign({
      algorithm: 'eth_rawSign',
      keyRef: this.keyRef.kid,
      encoding: 'base16',
      // @ts-ignore // KMS accepts uint8arrays but interface does not expose it
      data: message,
    })
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    return await this.context.agent.keyManagerSign({
      algorithm: 'eth_signMessage',
      keyRef: this.keyRef.kid,
      encoding: 'base16',
      // @ts-ignore // KMS accepts uint8arrays but interface does not expose it
      data: message,
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

  connect(provider?: Provider): EthersKMSSigner {
    return new EthersKMSSigner({ provider, context: this.context, keyRef: this.keyRef })
  }
}

/*
/!**
 * Convert signature format of the `eth_sign` RPC method to signature parameters
 * NOTE: all because of a bug in geth: https://github.com/ethereum/go-ethereum/issues/2053
 *!/
export const fromRpcSig = function(sig: string): ECDSASignature {
  const buf: Buffer = toBuffer(sig)

  if (buf.length < 65) {
    throw new Error('Invalid signature length')
  }

  let v = bufferToInt(buf.slice(64))
  // support both versions of `eth_sign` responses
  if (v < 27) {
    v += 27
  }

  return {
    v: v,
    r: buf.slice(0, 32),
    s: buf.slice(32, 64)
  }
}
*/
