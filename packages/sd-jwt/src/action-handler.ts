import { Jwt, SDJwt } from '@sd-jwt/core'
import { SDJwtVcInstance, SdJwtVcPayload } from '@sd-jwt/sd-jwt-vc'
import { DisclosureFrame, JwtPayload, KbVerifier, PresentationFrame, Signer, Verifier } from '@sd-jwt/types'
import { getFirstKeyWithRelation } from '@sphereon/ssi-sdk-ext.did-utils'
import { calculateJwkThumbprint, JWK } from '@sphereon/ssi-sdk-ext.key-utils'
import { IAgentPlugin } from '@veramo/core'
import { _ExtendedIKey } from '@veramo/utils'
import Debug from 'debug'

import { SignKeyArgs, SignKeyResult } from './index'
import { sphereonCA } from './trustAnchors'
import {
  Claims,
  ICreateSdJwtPresentationArgs,
  ICreateSdJwtPresentationResult,
  ICreateSdJwtVcArgs,
  ICreateSdJwtVcResult,
  IRequiredContext,
  ISDJwtPlugin,
  IVerifySdJwtPresentationArgs,
  IVerifySdJwtPresentationResult,
  IVerifySdJwtVcArgs,
  IVerifySdJwtVcResult,
  SdJWTImplementation,
} from './types'

const debug = Debug('@sphereon/ssi-sdk.sd-jwt')

/**
 * @beta
 * SD-JWT plugin
 */
export class SDJwtPlugin implements IAgentPlugin {
  private readonly trustAnchorsInPEM: string[]

  constructor(
    private registeredImplementations: SdJWTImplementation,
    trustAnchorsInPEM?: string[],
  ) {
    this.trustAnchorsInPEM = trustAnchorsInPEM ?? []
  }

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
      hasher: this.registeredImplementations.hasher,
      saltGenerator: this.registeredImplementations.saltGenerator,
      signAlg: alg,
      hashAlg: 'SHA-256',
    })

    const credential = await sdjwt.issue(args.credentialPayload, args.disclosureFrame as DisclosureFrame<typeof args.credentialPayload>)
    return { credential }
  }

  /**
   * Get the key to sign the SD-JWT
   * @param args - consists of twp arguments: identifier like a did and other forms of identifiers and vmRelationship which represents the purpose of the key
   * @param context - agent instance
   * @returns the key to sign the SD-JWT
   */
  async getSignKey(args: SignKeyArgs, context: IRequiredContext): Promise<SignKeyResult> {
    const { identifier, vmRelationship } = { ...args }
    if (identifier.startsWith('did:')) {
      const didIdentifier = await context.agent.didManagerGet({
        did: identifier.split('#')[0],
      })
      const key: _ExtendedIKey | undefined = await getFirstKeyWithRelation(
        {
          identifier: didIdentifier,
          vmRelationship: vmRelationship,
        },
        context,
      )
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
    const cred = await SDJwt.fromEncode(args.presentation, this.registeredImplementations.hasher)
    const claims = await cred.getClaims<Claims>(this.registeredImplementations.hasher)
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
      hasher: this.registeredImplementations.hasher,
      saltGenerator: this.registeredImplementations.saltGenerator,
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

    sdjwt = new SDJwtVcInstance({ verifier, hasher: this.registeredImplementations.hasher })
    const { header, payload, kb } = await sdjwt.verify(args.credential)

    return { header, payload, kb }
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
    return this.registeredImplementations.verifySignature(data, signature, key)
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
    const header = (decodedVC.jwt as Jwt).header as Record<string, any>
    const x5c: string[] | undefined = header?.x5c as string[]
    let jwk: JWK | JsonWebKey | undefined = undefined
    if (issuer.includes('did:')) {
      const didDoc = await context.agent.resolveDid({ didUrl: issuer })
      if (!didDoc) {
        throw new Error('invalid_issuer: issuer did not resolve to a did document')
      }
      //TODO SDK-20: This should be checking for an assertionMethod and not just an verificationMethod with an id
      const didDocumentKey = didDoc.didDocument?.verificationMethod?.find((key) => key.id)
      if (!didDocumentKey) {
        throw new Error('invalid_issuer: issuer did document does not include referenced key')
      }
      //FIXME SDK-21: in case it's another did method, the value of the key can be also encoded as a base64url
      // needs more checks. some DID methods do not expose the keys as publicKeyJwk
      jwk = didDocumentKey.publicKeyJwk as JsonWebKey
    }
    if (x5c) {
      const trustAnchors = new Set<string>([...this.trustAnchorsInPEM])
      if (trustAnchors.size === 0) {
        trustAnchors.add(sphereonCA)
      }
      const certificateValidationResult = await context.agent.x509VerifyCertificateChain({
        chain: x5c,
        trustAnchors: Array.from(trustAnchors),
      })

      if (certificateValidationResult.error || !certificateValidationResult?.certificateChain) {
        throw new Error('Certificate chain validation failed')
      }
      const certInfo = certificateValidationResult.certificateChain[0]
      jwk = certInfo.publicKeyJWK as JWK
    }

    if (!jwk) {
      throw new Error('No valid public key found for signature verification')
    }
    return this.registeredImplementations.verifySignature(data, signature, jwk)
  }

  /**
   * Verify a signed SD-JWT presentation.
   * @param args - Arguments necessary for the verify a SD-JWT presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @returns
   */
  async verifySdJwtPresentation(args: IVerifySdJwtPresentationArgs, context: IRequiredContext): Promise<IVerifySdJwtPresentationResult> {
    let sdjwt: SDJwtVcInstance
    const verifier: Verifier = async (data: string, signature: string) => this.verify(sdjwt, context, data, signature)
    const verifierKb: KbVerifier = async (data: string, signature: string, payload: JwtPayload) =>
      this.verifyKb(sdjwt, context, data, signature, payload)
    sdjwt = new SDJwtVcInstance({
      verifier,
      hasher: this.registeredImplementations.hasher,
      kbVerifier: verifierKb,
    })
    const verifiedPayloads = await sdjwt.verify(args.presentation, args.requiredClaimKeys, args.kb)

    return verifiedPayloads
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
