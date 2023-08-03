import {Provider, TransactionRequest} from "@ethersproject/abstract-provider";
import {Signer, TypedDataDomain, TypedDataField, TypedDataSigner} from "@ethersproject/abstract-signer";
import {arrayify} from "@ethersproject/bytes";
import { serialize } from "@ethersproject/transactions";
import {IKey, ManagedKeyInfo} from "@veramo/core";
import {AbstractKeyManagementSystem, Eip712Payload} from "@veramo/key-manager";
import * as u8a from 'uint8arrays'


export class Web3KMSSignerBuilder {
    private kms?: AbstractKeyManagementSystem
    private keyRef?: Pick<IKey, 'kid'>
    private provider?: Provider

    withKms(kms: AbstractKeyManagementSystem): this {
        this.kms = kms
        return this
    }

    withKid(kid: string): this {
        this.keyRef = {kid}
        return this
    }

    withKeyRef(keyRef: Pick<IKey, 'kid'> | string): this {
        if (typeof keyRef === 'string') {
            return this.withKid(keyRef)
        }

        this.keyRef = keyRef
        return this
    }

    withProvider(provider: Provider): this {
        this.provider = provider
        return this
    }

    build() {
        if (!this.kms) {
            throw Error('KMS needs to be provided')
        }
        if (!this.keyRef) {
            throw Error('Keyref needs to be provided')
        }
        return new Web3KMSSigner({kms: this.kms, keyRef: this.keyRef, provider: this.provider})
    }
}

/**
 * This is a Web3 signer that delegates back to the KMS for the actual signatures.
 * This means we do not expose private keys and can use any Secp256k1 key stored in the KMS if we want
 *
 * Be aware that the provided KeyRef needs to belong to the respective KMS, as it will use a lookup for the key in the KMS to sign
 */
export class Web3KMSSigner extends Signer implements TypedDataSigner {
    private readonly kms: AbstractKeyManagementSystem
    private readonly keyRef: Pick<IKey, 'kid'>


    constructor({provider, kms, keyRef}: {
        provider?: Provider,
        kms: AbstractKeyManagementSystem,
        keyRef: Pick<IKey, 'kid'>
    }) {
        super(provider);
        this.kms = kms;
        this.keyRef = keyRef
    }



    private async getKey(): Promise<ManagedKeyInfo | undefined> {
        const keys = await this.kms.listKeys();
        return keys.find(key => key.kid === this.keyRef.kid);
    }

    async signTransaction(tx: TransactionRequest): Promise<string> {
        return this.kms.sign({
            algorithm: 'eth_signTransaction',
            keyRef: this.keyRef,
            // @ts-ignore
            data: arrayify(serialize(tx))
        })
    }

    async signMessage(message: string | Uint8Array): Promise<string> {
        return this.kms.sign({
            algorithm: 'eth_signMessage',
            keyRef: this.keyRef,
            data: typeof message === 'string' ? u8a.fromString(message) : message
        })
    }

    async _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
        const jsonData: Partial<Eip712Payload> = {
            domain,
            types,
            message: value
        }
        return this.kms.sign({
            algorithm: 'eth_signTypedData',
            keyRef: this.keyRef,
            data: u8a.fromString(JSON.stringify(jsonData))
        })
    }

    async getAddress(): Promise<string> {
        return `0x${await this.getKey().then(key => key?.publicKeyHex)}`
    }
}
