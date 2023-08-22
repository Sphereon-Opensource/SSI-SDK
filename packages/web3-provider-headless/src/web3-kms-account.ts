/*
import {IKey} from "@veramo/core";
import {splitSignature} from "ethers/lib/utils";

import {hashMessage, Transaction} from "web3-eth-accounts";
import {HexString, Web3BaseWalletAccount, KeyStore} from "web3-types";
import {bytesToHex, numberToHex} from "web3-utils";
import {getAddressFromAgent} from "./functions";
import {IRequiredContext} from "./types";
import * as ethereumCryptography from 'ethereum-cryptography/secp256k1.js';

import * as u8a from 'uint8arrays'

export const secp256k1 = ethereumCryptography.secp256k1 ?? ethereumCryptography;

export interface IWeb3KmsAccount extends Web3BaseWalletAccount {
    address: HexString;
}

export class Web3KmsAccount implements IWeb3KmsAccount {
    [key: string]: unknown;

    private readonly context: IRequiredContext;
    private readonly keyRef: Pick<IKey, 'kid'>
    readonly address: HexString;

    private constructor({context, keyRef, address}: {
        context: IRequiredContext;
        keyRef: Pick<IKey, 'kid'>;
        address: HexString
    }) {
        this.context = context
        this.keyRef = keyRef
        this.address = address
    }

    public static async newInstance({context, keyRef}: {
        context: IRequiredContext;
        keyRef: Pick<IKey, 'kid'>
    }) {
        return new Web3KmsAccount({context, keyRef, address: await getAddressFromAgent(context, keyRef) as HexString})
    }


    encrypt(password: string, options: Record<string, unknown> | undefined): Promise<KeyStore> {
        throw Error('Not supported (yet)')
    }

    readonly sign = (data: Record<string, unknown> | string): {
        readonly messageHash: HexString;
        readonly r: HexString;
        readonly s: HexString;
        readonly v: HexString;
        readonly message?: string
        readonly signature: HexString;
    } => {
        const message = typeof data === 'string' ? data : JSON.stringify(data)
        const hash = hashMessage(message);



        const sig =  this.context.agent.keyManagerSign({
            algorithm: 'secp256k1',
            keyRef: this.keyRef.kid,
            data: hash.substring(2),
            encoding: 'base16'
        })
        const split = splitSignature(sig)


        const signatureBytes = split.compact
        const r = split.r
        const s = split.s
        const v = split.v

        return {
            message: message,
            messageHash: hash,
            v: numberToHex(v),
            r,
            s,
            signature: `${signatureBytes}${v.toString(16)}`,
        }
    };


    signTransaction(tx: Transaction): Promise<{
        readonly messageHash: HexString;
        readonly r: HexString;
        readonly s: HexString;
        readonly v: HexString;
        readonly rawTransaction: HexString;
        readonly transactionHash: HexString
    }> {

    }

}
*/
