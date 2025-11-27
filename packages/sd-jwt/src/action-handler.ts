import { Jwt, SDJwt, type SdJwtPayload, type VerifierOptions } from '@sd-jwt/core'
import { SDJwtVcInstance, type SdJwtVcPayload } from '@sd-jwt/sd-jwt-vc'
import type { DisclosureFrame, HashAlgorithm, Hasher, JwtPayload, KbVerifier, PresentationFrame, Signer, Verifier } from '@sd-jwt/types'
import { calculateJwkThumbprint, signatureAlgorithmFromKey } from '@sphereon/ssi-sdk-ext.key-utils'
import type { X509CertificateChainValidationOpts } from '@sphereon/ssi-sdk-ext.x509-utils'
import type { HasherSync, JsonWebKey, JWK, SdJwtTypeMetadata } from '@sphereon/ssi-types'
import type { IAgentPlugin } from '@veramo/core'
// import { decodeBase64url } from '@veramo/utils'
import Debug from 'debug'
import { defaultGenerateDigest, defaultGenerateSalt, defaultVerifySignature } from './defaultCallbacks'
import { funkeTestCA, sphereonCA } from './trustAnchors'
import {
  assertValidTypeMetadata,
  fetchUrlWithErrorHandling,
  getIssuerFromSdJwt,
  isSdjwtVcPayload,
  isVcdm2SdJwtPayload,
  validateIntegrity,
} from './utils'
import type {
  Claims,
  FetchSdJwtTypeMetadataFromVctUrlArgs,
  GetSignerForIdentifierArgs,
  GetSignerResult,
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
  SdJwtVerifySignature,
  SignKeyArgs,
  SignKeyResult,
} from './types'
import { SDJwtVcdm2Instance, SDJwtVcdmInstanceFactory } from './sdJwtVcdm2Instance'

// @ts-ignore
import * as u8a from 'uint8arrays'

const debug = Debug('@sphereon/ssi-sdk.sd-jwt')

/**
 * @beta
 * SD-JWT plugin
 */
export class SDJwtPlugin implements IAgentPlugin {
  // @ts-ignore
  private readonly trustAnchorsInPEM: string[]
  private readonly registeredImplementations: SdJWTImplementation
  private _signers: Record<string, Signer>
  private _defaultSigner?: Signer

  constructor(
    registeredImplementations?: SdJWTImplementation & {
      signers?: Record<string, Signer>
      defaultSigner?: Signer
    },
    trustAnchorsInPEM?: string[],
  ) {
    this.trustAnchorsInPEM = trustAnchorsInPEM ?? []
    if (!registeredImplementations) {
      registeredImplementations = {}
    }
    if (typeof registeredImplementations?.hasher !== 'function') {
      registeredImplementations.hasher = defaultGenerateDigest
    }
    if (typeof registeredImplementations?.saltGenerator !== 'function') {
      registeredImplementations.saltGenerator = defaultGenerateSalt
    }
    this.registeredImplementations = registeredImplementations
    this._signers = registeredImplementations?.signers ?? {}
    this._defaultSigner = registeredImplementations?.defaultSigner

    // Verify signature default is used below in the methods if not provided here, as it needs the context of the agent
  }

  // map the methods your plugin is declaring to their implementation
  readonly methods: ISDJwtPlugin = {
    createSdJwtVc: this.createSdJwtVc.bind(this),
    createSdJwtPresentation: this.createSdJwtPresentation.bind(this),
    verifySdJwtVc: this.verifySdJwtVc.bind(this),
    verifySdJwtPresentation: this.verifySdJwtPresentation.bind(this),
    fetchSdJwtTypeMetadataFromVctUrl: this.fetchSdJwtTypeMetadataFromVctUrl.bind(this),
  }

  private async getSignerForIdentifier(args: GetSignerForIdentifierArgs, context: IRequiredContext): Promise<GetSignerResult> {
    const { identifier, resolution } = args
    if (Object.keys(this._signers).includes(identifier) && typeof this._signers[identifier] === 'function') {
      return { signer: this._signers[identifier] }
    } else if (typeof this._defaultSigner === 'function') {
      return { signer: this._defaultSigner }
    }
    const signingKey = await this.getSignKey({ identifier, vmRelationship: 'assertionMethod', resolution }, context)
    const { key, alg } = signingKey

    const signer: Signer = async (data: string): Promise<string> => {
      return context.agent.keyManagerSign({ keyRef: key.kmsKeyRef, data })
    }

    return { signer, alg, signingKey }
  }

  /**
   * Create a signed SD-JWT credential.
   * @param args - Arguments necessary for the creation of a SD-JWT credential.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @returns A signed SD-JWT credential.
   */
  async createSdJwtVc(args: ICreateSdJwtVcArgs, context: IRequiredContext): Promise<ICreateSdJwtVcResult> {
    const payload = args.credentialPayload
    const isVcdm2 = isVcdm2SdJwtPayload(payload)
    const isSdJwtVc = isSdjwtVcPayload(payload)
    const type = args.type ?? (isVcdm2 ? 'vc+sd-jwt' : 'dc+sd-jwt')

    const issuer = getIssuerFromSdJwt(args.credentialPayload)
    if (!issuer) {
      throw new Error('credential.issuer must not be empty')
    }
    const { alg, signer, signingKey } = await this.getSignerForIdentifier({ identifier: issuer, resolution: args.resolution }, context)
    const signAlg = alg ?? signingKey?.alg ?? 'ES256'
    const hashAlg: HashAlgorithm = /(\d{3})$/.test(signAlg) ? (`sha-${signAlg.slice(-3)}` as HashAlgorithm) : 'sha-256'
    const sdjwt = SDJwtVcdmInstanceFactory.create(type, {
      omitTyp: true,
      signer,
      hasher: this.registeredImplementations.hasher,
      saltGenerator: this.registeredImplementations.saltGenerator,
      signAlg,
      hashAlg,
    })

    const header = {
      ...(signingKey?.key.kid !== undefined && { kid: signingKey.key.kid }),
      ...(signingKey?.key.x5c !== undefined && { x5c: signingKey.key.x5c }),
      ...(type && { typ: type }),
    }
    let credential: string
    if (isVcdm2) {
      credential = await (sdjwt as SDJwtVcdm2Instance).issue(
        payload,
        // @ts-ignore
        args.disclosureFrame as DisclosureFrame<typeof payload>,
        { header },
      )
    } else if (isSdJwtVc) {
      credential = await (sdjwt as SDJwtVcInstance).issue(payload, args.disclosureFrame as DisclosureFrame<typeof payload>, { header })
    } else {
      return Promise.reject(new Error(`invalid_argument: credential '${type}' type is not supported`))
    }

    return { type, credential }
  }

  /**
   * Get the key to sign the SD-JWT
   * @param args - consists of twp arguments: identifier like a did and other forms of identifiers and vmRelationship which represents the purpose of the key
   * @param context - agent instance
   * @returns the key to sign the SD-JWT
   */
  async getSignKey(args: SignKeyArgs, context: IRequiredContext): Promise<SignKeyResult> {
    // TODO Using identifierManagedGetByDid now (new managed identifier resolution). Evaluate of we need to implement more identifier types here
    const { identifier, resolution } = { ...args }
    if (resolution) {
      const key = resolution.key
      const alg = await signatureAlgorithmFromKey({ key })
      switch (resolution.method) {
        case 'did':
          debug(`Signing key ${key.publicKeyHex} found for identifier ${identifier}`)
          return { alg, key: { ...key, kmsKeyRef: resolution.kmsKeyRef, kid: resolution.kid } }
        default:
          if (key.meta?.x509 && key.meta.x509.x5c) {
            return { alg, key: { kid: resolution.kid, kmsKeyRef: resolution.kmsKeyRef, x5c: key.meta.x509.x5c as string[] } }
          } else if (key.meta?.jwkThumbprint) {
            return { alg, key: { kid: resolution.kid, kmsKeyRef: resolution.kmsKeyRef, jwkThumbprint: key.meta.jwkThumbprint } }
          } else {
            return { alg, key: { kid: resolution.kid, kmsKeyRef: resolution.kmsKeyRef } }
          }
      }
    } else if (identifier.startsWith('did:')) {
      const didIdentifier = await context.agent.identifierManagedGetByDid({ identifier })
      if (!didIdentifier) {
        throw new Error(`No identifier found with the given did: ${identifier}`)
      }
      const key = didIdentifier.key
      const alg = await signatureAlgorithmFromKey({ key })
      debug(`Signing key ${key.publicKeyHex} found for identifier ${identifier}`)

      return { alg, key: { ...key, kmsKeyRef: didIdentifier.kmsKeyRef, kid: didIdentifier.kid } }
    } else {
      const kidIdentifier = await context.agent.identifierManagedGetByKid({ identifier })
      if (!kidIdentifier) {
        throw new Error(`No identifier found with the given kid: ${identifier}`)
      }
      const key = kidIdentifier.key
      const alg = await signatureAlgorithmFromKey({ key })
      if (key.meta?.x509 && key.meta.x509.x5c) {
        return { alg, key: { kid: kidIdentifier.kid, kmsKeyRef: kidIdentifier.kmsKeyRef, x5c: key.meta.x509.x5c as string[] } }
      } else if (key.meta?.jwkThumbprint) {
        return { alg, key: { kid: kidIdentifier.kid, kmsKeyRef: kidIdentifier.kmsKeyRef, jwkThumbprint: key.meta.jwkThumbprint } }
      } else {
        return { alg, key: { kid: kidIdentifier.kid, kmsKeyRef: kidIdentifier.kmsKeyRef } }
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
    const type = args.type ?? 'dc+sd-jwt'

    const cred = await SDJwt.fromEncode(args.presentation, this.registeredImplementations.hasher!)

    const claims = await cred.getClaims<Claims>(this.registeredImplementations.hasher!)
    let holder: string
    // we primarily look for a cnf field, if it's not there, we look for a sub field. If this is also not given, we throw an error since we can not sign it.
    if (args.holder) {
      holder = args.holder
    } else if (claims.cnf?.jwk) {
      const jwk = claims.cnf.jwk
      holder = calculateJwkThumbprint({ jwk: jwk as JWK })
    } else if (claims.cnf?.kid) {
      holder = claims.cnf?.kid
    } else if (claims.sub) {
      holder = claims.sub as string
    } else {
      throw new Error('invalid_argument: credential does not include a holder reference')
    }
    const { alg, signer } = await this.getSignerForIdentifier({ identifier: holder }, context)

    const sdjwt = SDJwtVcdmInstanceFactory.create(type, {
      omitTyp: true,
      hasher: this.registeredImplementations.hasher,
      saltGenerator: this.registeredImplementations.saltGenerator,
      kbSigner: signer,
      kbSignAlg: alg ?? 'ES256',
    })

    const presentation = await sdjwt.present(args.presentation, args.presentationFrame as PresentationFrame<SdJwtVcPayload>, { kb: args.kb })

    return { type, presentation }
  }

  /**
   * Verify a signed SD-JWT credential.
   * @param args - Arguments necessary for the verify a SD-JWT credential.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @returns
   */
  async verifySdJwtVc(args: IVerifySdJwtVcArgs, context: IRequiredContext): Promise<IVerifySdJwtVcResult> {
    // callback
    const verifier: Verifier = async (data: string, signature: string) => this.verifyCallbackImpl(sdjwt, context, data, signature)

    const cred = await SDJwt.fromEncode(args.credential, this.registeredImplementations.hasher!)
    const type = isVcdm2SdJwtPayload(cred.jwt?.payload as SdJwtPayload) ? 'vc+sd-jwt' : 'dc+sd-jwt'

    const sdjwt = SDJwtVcdmInstanceFactory.create(type, { verifier, hasher: this.registeredImplementations.hasher ?? defaultGenerateDigest })
    // FIXME: Findynet. Issuer returns expired status lists, and low level lib throws errors on these. We need to fix this in our implementation by wrapping the verification function
    // For now a workaround is to ad 5 days of skew seconds, yuck
    const { header = {}, payload, kb } = await sdjwt.verify(args.credential, { skewSeconds: 60 * 60 * 24 * 5 })

    return { type, header, payload, kb }
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
  private verifyKb(context: IRequiredContext, data: string, signature: string, payload: JwtPayload): Promise<boolean> {
    if (!payload.cnf) {
      throw Error('other method than cnf is not supported yet')
    }

    // TODO add aud verification

    return this.verifySignatureCallback(context)(data, signature, this.getJwk(payload))
  }

  /**
   * Validates the signature of a SD-JWT
   * @param sdjwt - SD-JWT instance
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @param data - signed data
   * @param signature - The signature
   * @returns
   */
  async verifyCallbackImpl(
    sdjwt: SDJwtVcInstance | SDJwtVcdm2Instance,
    context: IRequiredContext,
    data: string,
    signature: string,
    opts?: { x5cValidation?: X509CertificateChainValidationOpts },
  ): Promise<boolean> {
    const decodedVC = await sdjwt.decode(`${data}.${signature}`)
    const payload: SdJwtPayload = (decodedVC.jwt as Jwt).payload as SdJwtPayload
    const issuer: string = getIssuerFromSdJwt(payload)
    const header = (decodedVC.jwt as Jwt).header as Record<string, any>
    const x5c: string[] | undefined = header?.x5c as string[]
    let jwk: JWK | JsonWebKey | undefined = header.jwk
    if (x5c?.length) {
      const trustAnchors = new Set<string>([...this.trustAnchorsInPEM])
      if (trustAnchors.size === 0) {
        trustAnchors.add(sphereonCA)
        trustAnchors.add(funkeTestCA)
      }
      const certificateValidationResult = await context.agent.x509VerifyCertificateChain({
        chain: x5c,
        trustAnchors: Array.from(trustAnchors),
        // TODO: Defaults to allowing untrusted certs! Fine for now, not when wallets go mainstream
        opts: opts?.x5cValidation ?? { trustRootWhenNoAnchors: true, allowNoTrustAnchorsFound: true },
      })

      if (certificateValidationResult.error || !certificateValidationResult?.certificateChain) {
        return Promise.reject(Error(`Certificate chain validation failed. ${certificateValidationResult.message}`))
      }
      const certInfo = certificateValidationResult.certificateChain[0]
      jwk = certInfo.publicKeyJWK as JWK
    }

    if (!jwk && header.kid?.includes('did:')) {
      const didDoc = await context.agent.resolveDid({ didUrl: header.kid })
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

    if (!jwk && issuer.includes('did:')) {
      // TODO refactor
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

    if (!jwk) {
      throw new Error('No valid public key found for signature verification')
    }

    return this.verifySignatureCallback(context)(data, signature, jwk)
  }

  /**
   * Verify a signed SD-JWT presentation.
   * @param args - Arguments necessary for the verify a SD-JWT presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @returns
   */
  async verifySdJwtPresentation(args: IVerifySdJwtPresentationArgs, context: IRequiredContext): Promise<IVerifySdJwtPresentationResult> {
    let sdjwt: SDJwtVcInstance
    const verifier: Verifier = async (data: string, signature: string) => this.verifyCallbackImpl(sdjwt, context, data, signature)
    const verifierKb: KbVerifier = async (data: string, signature: string, payload: JwtPayload) => this.verifyKb(context, data, signature, payload)
    sdjwt = new SDJwtVcInstance({
      verifier,
      hasher: this.registeredImplementations.hasher,
      kbVerifier: verifierKb,
    })

    const verifierOpts: VerifierOptions = {
      requiredClaimKeys: args.requiredClaimKeys,
      keyBindingNonce: args.keyBindingNonce,
    }

    return sdjwt.verify(args.presentation, verifierOpts)
  }

  /**
   * Fetch and validate Type Metadata.
   * @param args - Arguments necessary for fetching and validating the type metadata.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   * @returns
   */
  async fetchSdJwtTypeMetadataFromVctUrl(args: FetchSdJwtTypeMetadataFromVctUrlArgs, context: IRequiredContext): Promise<SdJwtTypeMetadata> {
    const { vct, vctIntegrity, opts } = args
    const url = new URL(vct)

    const response = await fetchUrlWithErrorHandling(url.toString())
    const metadata: SdJwtTypeMetadata = (await response.json()) as SdJwtTypeMetadata
    assertValidTypeMetadata(metadata, vct)

    const validate = async (vct: string, input: unknown, integrityValue?: string, hasher?: Hasher | HasherSync) => {
      if (hasher && integrityValue) {
        const validation = await validateIntegrity({ integrityValue, input, hasher })
        if (!validation) {
          return Promise.reject(Error(`Integrity check failed for vct: ${vct}, extends: ${metadata.extends}, integrity: ${integrityValue}}`))
        }
      }
    }

    const hasher = (opts?.hasher ?? this.registeredImplementations.hasher ?? defaultGenerateDigest) as Hasher | HasherSync | undefined
    if (hasher) {
      if (vctIntegrity) {
        await validate(vct, metadata, vctIntegrity, hasher)
        const vctValidation = await validateIntegrity({ integrityValue: vctIntegrity, input: metadata, hasher })
        if (!vctValidation) {
          return Promise.reject(Error(`Integrity check failed for vct: ${vct}, integrity: ${vctIntegrity}`))
        }
      }

      if (metadata['extends#integrity']) {
        const extendsMetadata = await this.fetchSdJwtTypeMetadataFromVctUrl({ vct: metadata['extends#integrity'], opts }, context)
        await validate(vct, extendsMetadata, metadata['extends#integrity'], hasher)
      }

      if (metadata['schema_uri#integrity']) {
        const schemaResponse = await fetchUrlWithErrorHandling(metadata.schema_uri!)
        const schema = await schemaResponse.json()
        await validate(vct, schema, metadata['schema_uri#integrity'], hasher)
      }

      metadata.display?.forEach((display) => {
        const simpleLogoIntegrity = display.rendering?.simple?.logo?.['uri#integrity']
        if (simpleLogoIntegrity) {
          console.log('TODO: Logo integrity check')
        }
      })
    }

    return metadata
  }

  private verifySignatureCallback(context: IRequiredContext): SdJwtVerifySignature {
    if (typeof this.registeredImplementations.verifySignature === 'function') {
      return this.registeredImplementations.verifySignature
    }

    return defaultVerifySignature(context)
  }

  private getJwk(payload: JwtPayload): JsonWebKey {
    if (payload.cnf?.jwk !== undefined) {
      return payload.cnf.jwk as JsonWebKey
    } else if (payload.cnf !== undefined && 'kid' in payload.cnf && typeof payload.cnf.kid === 'string' && payload.cnf.kid.startsWith('did:jwk:')) {
      // extract JWK from kid FIXME isn't there a did function for this already? Otherwise create one
      // FIXME this is a quick-fix to make verification but we need a real solution
      const encoded = this.extractBase64FromDIDJwk(payload.cnf.kid)
      const decoded = u8a.toString(u8a.fromString(encoded, 'base64url'), 'utf-8')
      const jwt = JSON.parse(decoded)
      return jwt as JsonWebKey
    }
    throw Error('Unable to extract JWK from SD-JWT payload')
  }

  private extractBase64FromDIDJwk(did: string): string {
    const parts = did.split(':')
    if (parts.length < 3) {
      throw new Error('Invalid DID format')
    }
    return parts[2].split('#')[0]
  }
}
