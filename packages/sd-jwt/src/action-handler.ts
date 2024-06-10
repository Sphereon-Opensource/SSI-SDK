import { schema } from './index'
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
import { mapIdentifierKeysToDocWithJwkSupport } from '@sphereon/ssi-sdk-ext.did-utils'
import { encodeJoseBlob } from '@veramo/utils'

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

    const { alg, key } = await this.getSignKey(issuer, context)

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
   * @param issuer - did url like did:exmaple.com#key-1
   * @param context - agent instance
   * @returns the key to sign the SD-JWT
   */
  private async getSignKey(issuer: string, context: IRequiredContext) {
    const identifier = await context.agent.didManagerGet({
      did: issuer.split('#')[0],
    })
    const doc = await mapIdentifierKeysToDocWithJwkSupport(identifier, 'assertionMethod', context)
    if (!doc || doc.length === 0) {
      throw new Error('No key found for signing')
    }
    const key = doc.find((key) => key.meta.verificationMethod.id === issuer)
    if (!key) {
      throw new Error(`No key found with the given id: ${issuer}`)
    }
    const alg = this.getKeyTypeAlgorithm(key.type)

    return { alg, key }
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
    let holderDID: string
    // we primarly look for a cnf field, if it's not there we look for a sub field. If this is also not given, we throw an error since we can not sign it.
    if (claims.cnf?.jwk) {
      const key = claims.cnf.jwk
      //TODO SDK-19: convert the JWK to hex and search for the appropriate key and associated DID
      //doesn't apply to did:jwk only, as you can represent any DID key as a JWK. So whenever you encounter a JWK it doesn't mean it had to come from a did:jwk in the system. It just can always be represented as a did:jwk
      holderDID = `did:jwk:${encodeJoseBlob(key)}#0`
    } else if (claims.sub) {
      holderDID = claims.sub as string
    } else {
      throw new Error('invalid_argument: credential does not include a holder reference')
    }
    const { alg, key } = await this.getSignKey(holderDID, context)

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
    if (!issuer.startsWith('did:')) {
      throw new Error('invalid_issuer: issuer must be a did')
    }
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
    //needs more checks. some DID methods do not expose the keys as publicKeyJwk
    const key = didDocumentKey.publicKeyJwk as JsonWebKey
    return this.algorithms.verifySignature(data, signature, key)
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
