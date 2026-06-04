import mdocPkg from '@sphereon/kmp-mdoc-core'
const { com } = mdocPkg
import { calculateJwkThumbprint } from '@sphereon/ssi-sdk-ext.key-utils'
import { CertificateInfo, getCertificateInfo, pemOrDerToX509Certificate, X509ValidationResult } from '@sphereon/ssi-sdk-ext.x509-utils'
import { JWK } from '@sphereon/ssi-types'
import { IAgentPlugin } from '@veramo/core'
import { MdocOid4vpPresentArgs, MdocOid4VPPresentationAuth, MdocOid4vpRPVerifyArgs, MdocOid4vpRPVerifyResult, MdocOid4vpService, schema } from '..'
import { CoseCryptoService, X509CallbackService } from '../functions'
import {
  CborByteString,
  CoseCryptoServiceJS,
  CoseJoseKeyMappingService,
  CoseKeyCbor,
  DateTimeUtils,
  decodeFrom,
  DocumentCbor,
  DocumentDescriptorMatchResult,
  encodeTo,
  Encoding,
  GetX509CertificateInfoArgs,
  ImDLMdoc,
  IOid4VPPresentationDefinition,
  IRequiredContext,
  IVerifySignatureResult,
  KeyInfo,
  KeyType,
  Oid4VPPresentationSubmission,
  MdocValidations,
  MdocVerifyIssuerSignedArgs,
  VerifyCertificateChainArgs,
} from '../types/ImDLMdoc'

export const mdocSupportMethods: Array<string> = [
  'x509VerifyCertificateChain',
  'x509GetCertificateInfo',
  'mdocVerifyIssuerSigned',
  'mdocOid4vpHolderPresent',
  'mdocOid4vpRPVerify',
]

/**
 * The MDLMdoc class implements the IAgentPlugin interface, providing methods for
 * verification and information retrieval related to X.509 certificates and mDL (mobile
 * driver's license) documents.
 */
export class MDLMdoc implements IAgentPlugin {
  readonly schema = schema.IMDLMdoc
  readonly methods: ImDLMdoc = {
    x509VerifyCertificateChain: this.x509VerifyCertificateChain.bind(this),
    x509GetCertificateInfo: this.x509GetCertificateInfo.bind(this),
    mdocVerifyIssuerSigned: this.mdocVerifyIssuerSigned.bind(this),
    mdocOid4vpHolderPresent: this.mdocOid4vpHolderPresent.bind(this),
    mdocOid4vpRPVerify: this.mdocOid4vpRPVerify.bind(this),
  }
  private readonly staticTrustAnchors: string[]
  private readonly trustAnchorProvider?: () => string[]
  private readonly blindlyTrustedAnchorProvider?: () => string[]
  private opts: {
    trustRootWhenNoAnchors?: boolean
    allowSingleNoCAChainElement?: boolean
    blindlyTrustedAnchors?: string[]
  }

  constructor(args?: {
    trustAnchors?: string[]
    // Provider returning runtime trust anchors, merged with the static (constructor) trustAnchors on every verification.
    trustAnchorProvider?: () => string[]
    // Provider returning runtime blindly-trusted anchors, merged with opts.blindlyTrustedAnchors on every verification.
    blindlyTrustedAnchorProvider?: () => string[]
    opts?: {
      // Trust the supplied root from the chain, when no anchors are being passed in.
      trustRootWhenNoAnchors?: boolean
      // Do not perform a chain validation check if the chain only has a single value. This means only the certificate itself will be validated. No chain checks for CA certs will be performed. Only used when the cert has no issuer
      allowSingleNoCAChainElement?: boolean
      // WARNING: Do not use in production
      // Similar to regular trust anchors, but no validation is performed whatsoever. Do not use in production settings! Can be handy with self generated certificates as we perform many validations, making it hard to test with self-signed certs. Only applied in case a chain with 1 element is passed in to really make sure people do not abuse this option
      blindlyTrustedAnchors?: string[]
    }
  }) {
    this.staticTrustAnchors = args?.trustAnchors ?? []
    this.trustAnchorProvider = args?.trustAnchorProvider
    this.blindlyTrustedAnchorProvider = args?.blindlyTrustedAnchorProvider
    this.opts = args?.opts ?? { trustRootWhenNoAnchors: true }
  }

  // Live-merged anchors: static (constructor) + provider (runtime/user). Read on every verification.
  private get trustAnchors(): string[] {
    return [...this.staticTrustAnchors, ...(this.trustAnchorProvider?.() ?? [])]
  }

  private get effectiveBlindlyTrustedAnchors(): string[] {
    return [...(this.opts.blindlyTrustedAnchors ?? []), ...(this.blindlyTrustedAnchorProvider?.() ?? [])]
  }

  /**
   * Processes and verifies the provided mdoc, generates device response and presentation submission tokens.
   *
   * @param {MdocOid4vpPresentArgs} args - An object containing arguments for mdoc oid4vp holder presentation.
   * @param {IRequiredContext} _context - Required context for the operation.
   * @return {Promise<MdocOid4VPPresentationAuth>} A promise that resolves to an object containing vp_token and presentation_submission.
   */
  private async mdocOid4vpHolderPresent(args: MdocOid4vpPresentArgs, _context: IRequiredContext): Promise<MdocOid4VPPresentationAuth> {
    const { mdocs, presentationDefinition, trustAnchors, verifications, mdocHolderNonce, authorizationRequestNonce, responseUri, clientId } = args

    const oid4vpService = new MdocOid4vpService()
    // const mdoc = DocumentCbor.Static.cborDecode(decodeFrom(mdocBase64Url, Encoding.BASE64URL))
    const validate = async (mdoc: DocumentCbor) => {
      try {
        const result = await MdocValidations.fromDocumentAsync(
          mdoc,
          null,
          trustAnchors ?? this.trustAnchors,
          DateTimeUtils.Static.DEFAULT.dateTimeLocal((verifications?.verificationTime?.getTime() ?? Date.now()) / 1000),
          verifications?.allowExpiredDocuments,
        )
        if (result.error) {
          console.log(JSON.stringify(result, null, 2))
        }
        return result
      } catch (e) {
        console.log(e)
        return {
          error: true,
          verifications: [
            {
              name: 'mdoc',
              error: true,
              critical: true,
              message: e.message as string,
            },
          ],
        }
      }
    }

    const allMatches: DocumentDescriptorMatchResult[] = oid4vpService.matchDocumentsAndDescriptors(
      mdocHolderNonce,
      mdocs,
      presentationDefinition as IOid4VPPresentationDefinition,
    )
    const docsAndDescriptors: DocumentDescriptorMatchResult[] = []
    let lastError: mdocPkg.com.sphereon.crypto.generic.IVerifyResults<mdocPkg.com.sphereon.crypto.cose.ICoseKeyCbor> | undefined = undefined
    for (let match of allMatches) {
      if (match.document) {
        const result = await validate(match.document)
        if (!result.error || responseUri.includes('openid.net')) {
          // TODO: We relax for the conformance suite, as the cert would be invalid
          try {
            // Source the DEVICE key from the matched document's deviceKeyInfo (the mdoc MSO device key). The validation
            // result.keyInfo is the x5chain ISSUER key, which kmp-mdoc-core does not (yet) convert to a CborKey
            // ("we do not convert all properties to a Cborkey yet"), so result.keyInfo.key is undefined. Without a
            // complete device keyInfo the device-response assembly later fails ("Cannot read property 'toJson' of undefined").
            const matchDeviceKeyInfo: any = (match as any).deviceKeyInfo
            const deviceKeyInfoSource: any = matchDeviceKeyInfo ?? result.keyInfo
            console.log(
              `(mdl-mdoc:deviceKey) amend: match.deviceKeyInfo present=${!!matchDeviceKeyInfo}, match.deviceKeyInfo.key present=${!!matchDeviceKeyInfo?.key}, ` +
                `result.keyInfo present=${!!result.keyInfo}, result.keyInfo.key present=${!!result.keyInfo?.key}, source=${matchDeviceKeyInfo ? 'match.deviceKeyInfo' : 'result.keyInfo'}`,
            )
            const cborKey = deviceKeyInfoSource?.key ? CoseKeyCbor.Static.fromDTO(deviceKeyInfoSource.key) : undefined
            if (!cborKey) {
              // Note: this is the PUBLIC device key only (the private key is hardware-backed in the KMS). We only need
              // the public key here to look up the matching KMS key reference by thumbprint.
              throw Error(
                'No device (public) key found to amend: neither match.deviceKeyInfo.key nor result.keyInfo.key is populated. ' +
                  'The mdoc MSO device public key is required to resolve the hardware-backed KMS key for signing.',
              )
            }
            let jwk = CoseJoseKeyMappingService.toJoseJwk(cborKey).toJsonDTO<JWK>()
            if (!deviceKeyInfoSource?.kmsKeyRef) {
              const keyInfo = deviceKeyInfoSource
              const thumbprint = calculateJwkThumbprint({ jwk: jwk })
              const kid = jwk.kid ?? thumbprint
              console.log(`(mdl-mdoc:deviceKey) amend: resolved device public jwk kid=${jwk.kid}, thumbprint=${thumbprint}`)

              // The device COSE key kid can be the (mangled) x-coordinate; the KMS resolves the key by its JWK
              // thumbprint, so fall back to that when the kid lookup fails.
              let key
              try {
                key = await _context.agent.keyManagerGet({ kid })
              } catch (e) {
                console.log(`(mdl-mdoc:deviceKey) amend: keyManagerGet by kid '${kid}' failed (${(e as any)?.message}); retrying by thumbprint '${thumbprint}'`)
                key = await _context.agent.keyManagerGet({ kid: thumbprint })
              }
              const kms = key.kms
              const kmsKeyRef = key.meta?.kmsKeyRef ?? key.kid
              console.log(`(mdl-mdoc:deviceKey) amend: resolved hardware KMS key kms=${kms}, kmsKeyRef=${kmsKeyRef}`)
              const updateCborKey = cborKey.copy(false, cborKey.kty, cborKey.kid ?? new CborByteString(decodeFrom(kid, Encoding.UTF8)))
              const deviceKeyInfo = KeyInfo.Static.fromDTO(keyInfo).copy(
                kid,
                updateCborKey,
                keyInfo.opts,
                keyInfo.keyVisibility,
                keyInfo.signatureAlgorithm,
                keyInfo.x5c,
                kmsKeyRef,
                kms,
              )
              const updateMatch = match.copy(match.inputDescriptor, match.document, match.documentError, deviceKeyInfo)
              match = updateMatch
            }
          } catch (e: any) {
            console.log(`We tied to ammend key info from the KMS, but failed. Potential trouble ahead ${e.message}`, e)
          }

          docsAndDescriptors.push(match)
        } else if (result.error) {
          lastError = result
        }
      }
    }
    if (docsAndDescriptors.length === 0) {
      if (lastError) {
        return Promise.reject(Error(lastError.verifications[0].message ?? 'No matching documents found'))
      }
      return Promise.reject(Error('No matching documents found'))
    }
    // Log all createDeviceResponse arguments so we can reason about the post-sign 'toJson of undefined' crash.
    try {
      console.log(
        `(mdl-mdoc:deviceResponse) args: clientId=${clientId}, responseUri=${responseUri}, authorizationRequestNonce=${authorizationRequestNonce}, docCount=${docsAndDescriptors.length}`,
      )
      try {
        console.log(`(mdl-mdoc:deviceResponse) presentationDefinition=${JSON.stringify(presentationDefinition)}`)
      } catch (e: any) {
        console.log(`(mdl-mdoc:deviceResponse) presentationDefinition stringify failed: ${e?.message}`)
      }
      docsAndDescriptors.forEach((d: any, idx: number) => {
        const dk: any = d?.deviceKeyInfo
        let docType: any = undefined
        try {
          docType = d?.document?.docType?.value ?? d?.document?.MSO?.value?.docType?.value ?? d?.document?.getDocType?.()
        } catch {
          /* ignore */
        }
        console.log(
          `(mdl-mdoc:deviceResponse) doc[${idx}]: inputDescriptor.id=${d?.inputDescriptor?.id?.value ?? d?.inputDescriptor?.id}, docType=${docType}, ` +
            `document present=${!!d?.document}, documentError present=${!!d?.documentError}, ` +
            `deviceKeyInfo present=${!!dk}, deviceKeyInfo.key present=${!!dk?.key}, deviceKeyInfo.kid=${dk?.kid}, kmsKeyRef=${dk?.kmsKeyRef}, kms=${dk?.kms}, ` +
            `signatureAlgorithm=${dk?.signatureAlgorithm}, x5c present=${!!dk?.x5c}`,
        )
        try {
          const dkJson = dk?.toJson ? dk.toJson() : dk
          console.log(`(mdl-mdoc:deviceResponse) doc[${idx}] deviceKeyInfo=${JSON.stringify(dkJson)}`)
        } catch (e: any) {
          console.log(`(mdl-mdoc:deviceResponse) doc[${idx}] deviceKeyInfo serialize failed: ${e?.message}`)
        }
        try {
          const keyJson = dk?.key?.toJson ? dk.key.toJson() : dk?.key
          console.log(`(mdl-mdoc:deviceResponse) doc[${idx}] deviceKeyInfo.key=${JSON.stringify(keyJson)}`)
        } catch (e: any) {
          console.log(`(mdl-mdoc:deviceResponse) doc[${idx}] deviceKeyInfo.key serialize failed: ${e?.message}`)
        }
      })
    } catch (e: any) {
      console.log(`(mdl-mdoc:deviceResponse) argument logging failed: ${e?.message}`)
    }

    let deviceResponse
    try {
      deviceResponse = await oid4vpService.createDeviceResponse(
        docsAndDescriptors,
        presentationDefinition as IOid4VPPresentationDefinition,
        clientId,
        responseUri,
        authorizationRequestNonce,
      )
    } catch (e: any) {
      console.log(`(mdl-mdoc:deviceResponse) createDeviceResponse failed: ${e?.message}`)
      console.log(`(mdl-mdoc:deviceResponse) STACK: ${e?.stack}`)
      throw e
    }
    // NOTE: the 'Cannot read property toJson of undefined' crash happens HERE (after createDeviceResponse returns),
    // during cborEncode() of the assembled DeviceResponse — NOT inside createDeviceResponse. Probe + stack-log it.
    try {
      console.log(`(mdl-mdoc:deviceResponse) createDeviceResponse returned: present=${!!deviceResponse}, type=${typeof deviceResponse}`)
      const dr: any = deviceResponse as any
      try {
        const docs = dr?.documents ?? dr?.b3p_1 ?? undefined
        console.log(
          `(mdl-mdoc:deviceResponse) deviceResponse.version present=${!!dr?.version}, status present=${dr?.status != null}, ` +
            `documents present=${!!docs}, documentsCount=${docs?.length ?? docs?.size ?? 'n/a'}`,
        )
      } catch (e: any) {
        console.log(`(mdl-mdoc:deviceResponse) deviceResponse structure probe failed: ${e?.message}`)
      }
    } catch {
      /* ignore */
    }

    let vp_token: string
    try {
      const encoded = deviceResponse.cborEncode()
      console.log(`(mdl-mdoc:deviceResponse) cborEncode OK, byteLen=${encoded?.length}`)
      vp_token = encodeTo(encoded, Encoding.BASE64URL)
    } catch (e: any) {
      console.log(`(mdl-mdoc:deviceResponse) cborEncode failed: ${e?.message}`)
      console.log(`(mdl-mdoc:deviceResponse) cborEncode STACK: ${e?.stack}`)
      throw e
    }

    let presentation_submission
    try {
      presentation_submission = Oid4VPPresentationSubmission.Static.fromPresentationDefinition(presentationDefinition as IOid4VPPresentationDefinition)
    } catch (e: any) {
      console.log(`(mdl-mdoc:deviceResponse) fromPresentationDefinition failed: ${e?.message}`)
      console.log(`(mdl-mdoc:deviceResponse) fromPresentationDefinition STACK: ${e?.stack}`)
      throw e
    }
    return { vp_token, presentation_submission }
  }

  /**
   * Verifies on the Relying Party (RP) side for mdoc (mobile document) OIDC4VP (OpenID Connect for Verifiable Presentations).
   *
   * @param {MdocOid4vpRPVerifyArgs} args - The arguments required for verification, including the vp_token, presentation_submission, and trustAnchors.
   * @param {IRequiredContext} _context - The required context for this method.
   * @return {Promise<MdocOid4vpRPVerifyResult>} - A promise that resolves to an object containing error status,
   * validated documents, and the original presentation submission.
   */
  private async mdocOid4vpRPVerify(args: MdocOid4vpRPVerifyArgs, _context: IRequiredContext): Promise<MdocOid4vpRPVerifyResult> {
    const { vp_token, presentation_submission, trustAnchors } = args
    const deviceResponse = com.sphereon.mdoc.data.device.DeviceResponseCbor.Static.cborDecode(decodeFrom(vp_token, Encoding.BASE64URL))
    if (!deviceResponse.documents) {
      return Promise.reject(Error(`No documents found in vp_token`))
    }
    let error = false
    const documents = await Promise.all(
      deviceResponse.documents.map(async (document) => {
        try {
          const validations = await MdocValidations.fromDocumentAsync(document, null, trustAnchors ?? this.trustAnchors)
          if (!validations || validations.error) {
            error = true
          }
          if (presentation_submission.descriptor_map.find((m) => m.id === document.docType.value) === null) {
            error = true
            validations.verifications.push({
              name: 'mdoc',
              error,
              critical: error,
              message: `No descriptor map id with document type ${document.docType.value} present`,
            })
          }
          return { document: document.toJson(), validations }
        } catch (e) {
          error = true
          return {
            document: document.toJson(),
            validations: {
              error: true,
              verifications: [
                {
                  name: 'mdoc',
                  error,
                  critical: true,
                  message: e.message as string,
                },
              ],
            },
          }
        }
      }),
    )
    if (error) {
      console.log(JSON.stringify(documents, null, 2))
    }
    return { error, documents, presentation_submission }
  }

  /**
   * Verifies the issuer-signed Mobile Document (mDoc) using the provided arguments and context.
   *
   * @param {MdocVerifyIssuerSignedArgs} args - The arguments required for verification, including input and key information.
   * @param {IRequiredContext} context - The context encompassing necessary dependencies and configurations.
   * @return {Promise<IVerifySignatureResult<KeyType>>} A promise that resolves to the result of the signature verification, including key information if available.
   */
  private async mdocVerifyIssuerSigned(args: MdocVerifyIssuerSignedArgs, context: IRequiredContext): Promise<IVerifySignatureResult<KeyType>> {
    const { input, keyInfo, requireX5Chain } = args
    const coseKeyInfo = keyInfo && CoseJoseKeyMappingService.toCoseKeyInfo(keyInfo)
    const verification = await new CoseCryptoServiceJS(new CoseCryptoService(context)).verify1(
      com.sphereon.crypto.cose.CoseSign1Json.Static.fromDTO(input).toCbor(),
      coseKeyInfo,
      requireX5Chain,
    )
    return { ...verification, keyInfo: keyInfo }
  }

  /**
   * Verifies an X.509 certificate chain against a set of trust anchors.
   *
   * @param {VerifyCertificateChainArgs} args - The arguments required for verifying the certificate chain.
   * This includes the certificate chain to be verified and any additional trust anchors to be used.
   * @param {IRequiredContext} _context - The context required for verification, including necessary dependencies and settings.
   * @return {Promise<X509ValidationResult>} A promise that resolves to the result of the validation process, indicating the success or failure of the certificate chain verification.
   */
  private async x509VerifyCertificateChain(args: VerifyCertificateChainArgs, _context: IRequiredContext): Promise<X509ValidationResult> {
    const mergedAnchors: string[] = [...this.trustAnchors, ...(args.trustAnchors ?? [])]
    const trustAnchors = new Set<string>(mergedAnchors)
    const validationResult = await new X509CallbackService(Array.from(mergedAnchors)).verifyCertificateChain({
      ...args,
      trustAnchors: Array.from(trustAnchors),
      opts: { ...args?.opts, ...this.opts, blindlyTrustedAnchors: this.effectiveBlindlyTrustedAnchors },
    })
    console.log(
      `x509 validation for ${validationResult.error ? 'Error' : 'Success'}. message: ${validationResult.message}, details: ${validationResult.detailMessage}`,
    )
    return validationResult
  }

  /**
   * Extracts information from a list of X509 certificates.
   *
   * @param {GetX509CertificateInfoArgs} args - Arguments required to retrieve certificate information,
   * including the certificates and optional Subject Alternative Name (SAN) type filter.
   * @param {IRequiredContext} context - The context required for the operation, which may include
   * logging, configuration, and other operational details.
   * @return {Promise<CertificateInfo[]>} A promise that resolves with an array of certificate
   * information objects, each containing details extracted from individual certificates.
   */
  private async x509GetCertificateInfo(args: GetX509CertificateInfoArgs, context: IRequiredContext): Promise<CertificateInfo[]> {
    const certificates = args.certificates.map((cert) => pemOrDerToX509Certificate(cert))
    return await Promise.all(certificates.map((cert) => getCertificateInfo(cert, args.sanTypeFilter && { sanTypeFilter: args.sanTypeFilter })))
  }
}
