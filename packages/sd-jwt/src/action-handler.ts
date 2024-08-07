import Debug from 'debug'

import { schema, SignKeyArgs, SignKeyResult } from './index'
import { Jwt, SDJwt } from '@sd-jwt/core'
import { SDJwtVcInstance, SdJwtVcPayload } from '@sd-jwt/sd-jwt-vc'
import { Signer, Verifier, KbVerifier, JwtPayload, DisclosureFrame, PresentationFrame } from '@sd-jwt/types'
import { IAgentPlugin } from '@veramo/core'
import {
  SdJWTImplementation,
  ICreateSdJwtVcArgs,
  ICreateSdJwtVcResult,
  ICreateSdJwtPresentationArgs,
  ICreateSdJwtPresentationResult,
  IRequiredContext,
  ISDJwtPlugin,
  IVerifySdJwtVcArgs,
  IVerifySdJwtVcResult,
  IVerifySdJwtPresentationArgs,
  IVerifySdJwtPresentationResult,
  Claims,
} from './types'
import { _ExtendedIKey } from '@veramo/utils'
import { getFirstKeyWithRelation } from '@sphereon/ssi-sdk-ext.did-utils'
import { calculateJwkThumbprint, JWK, toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
const debug = Debug('@sphereon/sd-jwt')
/**
 * @beta
 * SD-JWT plugin for Veramo
 */
export class SDJwtPlugin implements IAgentPlugin {
  readonly schema = schema.ISDJwtPlugin

  constructor(private algorithms: SdJWTImplementation) {}

  // map the methods your plugin is declaring to their implementation
  readonly methods: ISDJwtPlugin = {
    createSdJwtVc: this.createSdJwtVc.bind(this),
    createSdJwtPresentation: this.createSdJwtPresentation.bind(this),
    verifySdJwtVc: this.verifySdJwtVc.bind(this),
    verifySdJwtPresentation: this.verifySdJwtPresentation.bind(this),
  }

  /**
   * Create a signed SD-JWT credential.
   * @param args - Arguments necessary for the creation of a SD-JWT credential.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @returns A signed SD-JWT credential.
   */
  async createSdJwtVc(args: ICreateSdJwtVcArgs, context: IRequiredContext): Promise<ICreateSdJwtVcResult> {
    const issuer = args.credentialPayload.iss
    if (!issuer) {
      throw new Error('credential.issuer must not be empty')
    }

    const { alg, key } = await this.getSignKey({ identifier: issuer, vmRelationship: 'assertionMethod' }, context)

    //TODO: let the user also insert a method to sign the data
    const signer: Signer = async (data: string) => context.agent.keyManagerSign({ keyRef: key.kid, data })

    const sdjwt = new SDJwtVcInstance({
      signer,
      hasher: this.algorithms.hasher,
      saltGenerator: this.algorithms.saltGenerator,
      signAlg: alg,
      hashAlg: 'SHA-256',
    })

    const credential = await sdjwt.issue(args.credentialPayload, args.disclosureFrame as DisclosureFrame<typeof args.credentialPayload>)
    return { credential }
  }

  /**
   * Get the key to sign the SD-JWT
   * @param identifier - identifier like a did and other forms of identifiers
   * @param context - agent instance
   * @returns the key to sign the SD-JWT
   */
  async getSignKey(args: SignKeyArgs, context: IRequiredContext): Promise<SignKeyResult> {
    const { identifier, vmRelationship } = { ...args }
    if (identifier.startsWith('did:')) {
      const didIdentifier = await context.agent.didManagerGet({
        did: identifier.split('#')[0],
      })
      //const doc = await mapIdentifierKeysToDocWithJwkSupport({ identifier: didIdentifier, vmRelationship: 'assertionMethod' }, context)
      const key: _ExtendedIKey | undefined = await getFirstKeyWithRelation({ identifier: didIdentifier, vmRelationship: vmRelationship }, context)
      if (!key) {
        throw new Error(`No key found with the given id: ${identifier}`)
      }
      const alg = this.getKeyTypeAlgorithm(key.type)
      debug(`Signing key ${key.publicKeyHex} found for identifier ${identifier}`)
      return { alg, key }
    } else {
      const key = await context.agent.keyManagerGet({ kid: identifier })
      if (!key) {
        throw new Error(`No key found with the identifier ${identifier}`)
      }
      const alg = this.getKeyTypeAlgorithm(key.type)
      if (key.meta?.x509 && key.meta.x509.x5c) {
        return { alg, key: { kid: key.kid, x5c: key.meta.x509.x5c as string[] } }
      } else if (key.meta?.jwkThumbprint) {
        return { alg, key: { kid: key.kid, jwkThumbprint: key.meta.jwkThumbprint } }
      } else {
        return { alg, key: { kid: key.kid } }
      }
    }
  }

  /**
   * Create a signed SD-JWT presentation.
   * @param args - Arguments necessary for the creation of a SD-JWT presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @returns A signed SD-JWT presentation.
   */
  async createSdJwtPresentation(args: ICreateSdJwtPresentationArgs, context: IRequiredContext): Promise<ICreateSdJwtPresentationResult> {
    const cred = await SDJwt.fromEncode(args.presentation, this.algorithms.hasher)
    const claims = await cred.getClaims<Claims>(this.algorithms.hasher)
    let holder: string
    // we primarly look for a cnf field, if it's not there we look for a sub field. If this is also not given, we throw an error since we can not sign it.
    if (claims.cnf?.jwk) {
      const jwk = claims.cnf.jwk
      holder = calculateJwkThumbprint({ jwk: jwk as JWK })
    } else if (claims.sub) {
      holder = claims.sub as string
    } else {
      throw new Error('invalid_argument: credential does not include a holder reference')
    }
    const { alg, key } = await this.getSignKey({ identifier: holder, vmRelationship: 'assertionMethod' }, context)

    const signer: Signer = async (data: string) => {
      return context.agent.keyManagerSign({ keyRef: key.kid, data })
    }

    const sdjwt = new SDJwtVcInstance({
      hasher: this.algorithms.hasher,
      saltGenerator: this.algorithms.saltGenerator,
      kbSigner: signer,
      kbSignAlg: alg,
    })
    const credential = await sdjwt.present(args.presentation, args.presentationFrame as PresentationFrame<SdJwtVcPayload>, { kb: args.kb })
    return { presentation: credential }
  }

  /**
   * Verify a signed SD-JWT credential.
   * @param args - Arguments necessary for the verify a SD-JWT credential.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @returns
   */
  async verifySdJwtVc(args: IVerifySdJwtVcArgs, context: IRequiredContext): Promise<IVerifySdJwtVcResult> {
    // biome-ignore lint/style/useConst: <explanation>
    let sdjwt: SDJwtVcInstance
    const verifier: Verifier = async (data: string, signature: string) => this.verify(sdjwt, context, data, signature)

    sdjwt = new SDJwtVcInstance({ verifier, hasher: this.algorithms.hasher })
    const verifiedPayloads = await sdjwt.verify(args.credential)

    return { verifiedPayloads }
  }

  /**
   * Verify the key binding of a SD-JWT by validating the signature of the key bound to the SD-JWT
   * @param sdjwt - SD-JWT instance
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @param data - signed data
   * @param signature - The signature
   * @param payload - The payload of the SD-JWT
   * @returns
   */
  private verifyKb(sdjwt: SDJwtVcInstance, context: IRequiredContext, data: string, signature: string, payload: JwtPayload): Promise<boolean> {
    if (!payload.cnf) {
      throw Error('other method than cnf is not supported yet')
    }
    const key = payload.cnf.jwk as JsonWebKey
    return this.algorithms.verifySignature(data, signature, key)
  }

  /**
   * Validates the signature of a SD-JWT
   * @param sdjwt - SD-JWT instance
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @param data - signed data
   * @param signature - The signature
   * @returns
   */
  async verify(sdjwt: SDJwtVcInstance, context: IRequiredContext, data: string, signature: string) {
    const decodedVC = await sdjwt.decode(`${data}.${signature}`)
    const issuer: string = ((decodedVC.jwt as Jwt).payload as Record<string, unknown>).iss as string
    const verifierKey: SignKeyResult = await this.getSignKey({ identifier: issuer, vmRelationship: 'verificationMethod' }, context)
    const key = await context.agent.keyManagerGet({ kid: verifierKey.key.jwkThumbprint ?? verifierKey.key.kid })
    return this.algorithms.verifySignature(data, signature, toJwk(key.publicKeyHex, key.type))
  }

  /**
   * Verify a signed SD-JWT presentation.
   * @param args - Arguments necessary for the verify a SD-JWT presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @returns
   */
  async verifySdJwtPresentation(args: IVerifySdJwtPresentationArgs, context: IRequiredContext): Promise<IVerifySdJwtPresentationResult> {
    // biome-ignore lint/style/useConst: <explanation>
    let sdjwt: SDJwtVcInstance
    const verifier: Verifier = async (data: string, signature: string) => this.verify(sdjwt, context, data, signature)
    const verifierKb: KbVerifier = async (data: string, signature: string, payload: JwtPayload) =>
      this.verifyKb(sdjwt, context, data, signature, payload)
    sdjwt = new SDJwtVcInstance({
      verifier,
      hasher: this.algorithms.hasher,
      kbVerifier: verifierKb,
    })
    const verifiedPayloads = await sdjwt.verify(args.presentation, args.requiredClaimKeys, args.kb)

    return { verifiedPayloads }
  }

  private getKeyTypeAlgorithm(keyType: string) {
    switch (keyType) {
      case 'Ed25519':
        return 'EdDSA'
      case 'Secp256k1':
        return 'ES256K'
      case 'Secp256r1':
        return 'ES256'
      default:
        throw new Error(`unsupported key type ${keyType}`)
    }
  }
}
