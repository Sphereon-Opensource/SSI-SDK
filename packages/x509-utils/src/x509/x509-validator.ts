import { AsnParser } from '@peculiar/asn1-schema'
import { SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { AlgorithmProvider, X509Certificate } from '@peculiar/x509'
// import {calculateJwkThumbprint} from "@sphereon/ssi-sdk-ext.key-utils";
import { JWK } from '@sphereon/ssi-types'
import x509 from 'js-x509-utils'
import { AltName, AttributeTypeAndValue, Certificate, CryptoEngine, getCrypto, id_SubjectAltName, setEngine } from 'pkijs'
import { container } from 'tsyringe'
// @ts-ignore
import * as u8a from 'uint8arrays'
const { fromString, toString } = u8a
import { globalCrypto } from './crypto'
import { areCertificatesEqual, derToPEM, pemOrDerToX509Certificate } from './x509-utils'

export type DNInfo = {
  DN: string
  attributes: Record<string, string>
}

export type CertificateInfo = {
  certificate?: any // We need to fix the schema generator for this to be Certificate(Json) from pkijs
  notBefore: Date
  notAfter: Date
  publicKeyJWK?: any
  issuer: {
    dn: DNInfo
  }
  subject: {
    dn: DNInfo
    subjectAlternativeNames: SubjectAlternativeName[]
  }
}

export type X509ValidationResult = {
  error: boolean
  critical: boolean
  message: string
  detailMessage?: string
  verificationTime: Date
  certificateChain?: Array<CertificateInfo>
  trustAnchor?: CertificateInfo
  client?: {
    // In case client id and scheme were passed in we return them for easy access. It means they are validated
    clientId: string
    clientIdScheme: ClientIdScheme
  }
}

const defaultCryptoEngine = () => {
  const name = 'crypto'
  setEngine(name, new CryptoEngine({ name, crypto: globalCrypto(false) }))
  return getCrypto(true)
}

export const getCertificateInfo = async (
  certificate: Certificate,
  opts?: {
    sanTypeFilter: SubjectAlternativeGeneralName | SubjectAlternativeGeneralName[]
  }
): Promise<CertificateInfo> => {
  let publicKeyJWK: JWK | undefined
  try {
    publicKeyJWK = (await getCertificateSubjectPublicKeyJWK(certificate)) as JWK
  } catch (e) {}
  return {
    issuer: { dn: getIssuerDN(certificate) },
    subject: {
      dn: getSubjectDN(certificate),
      subjectAlternativeNames: getSubjectAlternativeNames(certificate, { typeFilter: opts?.sanTypeFilter }),
    },
    publicKeyJWK,
    notBefore: certificate.notBefore.value,
    notAfter: certificate.notAfter.value,
    // certificate
  } satisfies CertificateInfo
}

export type X509CertificateChainValidationOpts = {
  // If no trust anchor is found, but the chain itself checks out, allow. (defaults to false:)
  allowNoTrustAnchorsFound?: boolean

  // Trust the supplied root from the chain, when no anchors are being passed in.
  trustRootWhenNoAnchors?: boolean
  // Do not perform a chain validation check if the chain only has a single value. This means only the certificate itself will be validated. No chain checks for CA certs will be performed. Only used when the cert has no issuer
  allowSingleNoCAChainElement?: boolean
  // WARNING: Do not use in production
  // Similar to regular trust anchors, but no validation is performed whatsoever. Do not use in production settings! Can be handy with self generated certificates as we perform many validations, making it hard to test with self-signed certs. Only applied in case a chain with 1 element is passed in to really make sure people do not abuse this option
  blindlyTrustedAnchors?: string[]

  disallowReversedChain?: boolean

  client?: {
    // If provided both are required. Validates the leaf certificate against the clientId and scheme
    clientId: string
    clientIdScheme: ClientIdScheme
  }
}

export const validateX509CertificateChain = async ({
  chain: pemOrDerChain,
  trustAnchors,
  verificationTime = new Date(),
  opts = {
    // If no trust anchor is found, but the chain itself checks out, allow. (defaults to false:)
    allowNoTrustAnchorsFound: false,
    trustRootWhenNoAnchors: false,
    allowSingleNoCAChainElement: true,
    blindlyTrustedAnchors: [],
    disallowReversedChain: false,
  },
}: {
  chain: (Uint8Array | string)[]
  trustAnchors?: string[]
  verificationTime?: Date
  opts?: X509CertificateChainValidationOpts
}): Promise<X509ValidationResult> => {
  // We allow 1 reversal. We reverse by default as the implementation expects the root ca first, whilst x5c is the opposite. Reversed becomes true if the impl reverses the chain
  return await validateX509CertificateChainImpl({
    reversed: false,
    chain: [...pemOrDerChain].reverse(),
    trustAnchors,
    verificationTime,
    opts,
  })
}
const validateX509CertificateChainImpl = async ({
  reversed,
  chain: pemOrDerChain,
  trustAnchors,
  verificationTime: verifyAt,
  opts,
}: {
  reversed: boolean
  chain: (Uint8Array | string)[]
  trustAnchors?: string[]
  verificationTime: Date | string // string for REST API
  opts: X509CertificateChainValidationOpts
}): Promise<X509ValidationResult> => {
  const verificationTime: Date = typeof verifyAt === 'string' ? new Date(verifyAt) : verifyAt
  const {
    allowNoTrustAnchorsFound = false,
    trustRootWhenNoAnchors = false,
    allowSingleNoCAChainElement = true,
    blindlyTrustedAnchors = [],
    disallowReversedChain = false,
    client,
  } = opts
  const trustedPEMs = trustRootWhenNoAnchors && !trustAnchors ? [pemOrDerChain[pemOrDerChain.length - 1]] : trustAnchors

  if (pemOrDerChain.length === 0) {
    return {
      error: true,
      critical: true,
      message: 'Certificate chain in DER or PEM format must not be empty',
      verificationTime,
    }
  }
  defaultCryptoEngine()

  // x5c always starts with the leaf cert at index 0 and then the cas. Our internal pkijs service expects it the other way around. Before calling this function the change has been revered
  const chain = await Promise.all(pemOrDerChain.map((raw) => parseCertificate(raw)))
  const x5cOrdereredChain = reversed ? [...chain] : [...chain].reverse()

  const trustedCerts = trustedPEMs ? await Promise.all(trustedPEMs.map((raw) => parseCertificate(raw))) : undefined
  const blindlyTrusted =
    (
      await Promise.all(
        blindlyTrustedAnchors.map((raw) => {
          try {
            return parseCertificate(raw)
          } catch (e) {
            // @ts-ignore
            console.log(`Failed to parse blindly trusted certificate ${raw}. Error: ${e.message}`)
            return undefined
          }
        })
      )
    ).filter((cert): cert is ParsedCertificate => cert !== undefined) ?? []
  const leafCert = x5cOrdereredChain[0]

  const chainLength = chain.length
  var foundTrustAnchor: ParsedCertificate | undefined = undefined
  for (let i = 0; i < chainLength; i++) {
    const currentCert = chain[i]
    const previousCert = i > 0 ? chain[i - 1] : undefined
    const blindlyTrustedCert = blindlyTrusted.find((trusted) => areCertificatesEqual(trusted.certificate, currentCert.certificate))
    if (blindlyTrustedCert) {
      console.log(`Certificate chain validation success as single cert if blindly trusted. WARNING: ONLY USE FOR TESTING PURPOSES.`)
      return {
        error: false,
        critical: false,
        message: `Certificate chain validation success as single cert if blindly trusted. WARNING: ONLY USE FOR TESTING PURPOSES.`,
        detailMessage: `Blindly trusted certificate ${blindlyTrustedCert.certificateInfo.subject.dn.DN} was found in the chain.`,
        trustAnchor: blindlyTrustedCert?.certificateInfo,
        verificationTime,
        certificateChain: x5cOrdereredChain.map((cert) => cert.certificateInfo),
        ...(client && { client }),
      }
    }
    if (previousCert) {
      if (currentCert.x509Certificate.issuer !== previousCert.x509Certificate.subject) {
        if (!reversed && !disallowReversedChain) {
          return await validateX509CertificateChainImpl({
            reversed: true,
            chain: [...pemOrDerChain].reverse(),
            opts,
            verificationTime,
            trustAnchors,
          })
        }
        return {
          error: true,
          critical: true,
          certificateChain: x5cOrdereredChain.map((cert) => cert.certificateInfo),
          message: `Certificate chain validation failed for ${leafCert.certificateInfo.subject.dn.DN}.`,
          detailMessage: `The certificate ${currentCert.certificateInfo.subject.dn.DN} with issuer ${currentCert.x509Certificate.issuer}, is not signed by the previous certificate ${previousCert?.certificateInfo.subject.dn.DN} with subject string ${previousCert?.x509Certificate.subject}.`,
          verificationTime,
          ...(client && { client }),
        }
      }
    }
    const result = await currentCert.x509Certificate.verify(
      {
        date: verificationTime,
        publicKey: previousCert?.x509Certificate?.publicKey,
      },
      getCrypto()?.crypto ?? crypto ?? global.crypto
    )
    if (!result) {
      // First cert needs to be self signed
      if (i == 0 && !reversed && !disallowReversedChain) {
        return await validateX509CertificateChainImpl({
          reversed: true,
          chain: [...pemOrDerChain].reverse(),
          opts,
          verificationTime,
          trustAnchors,
        })
      }

      return {
        error: true,
        critical: true,
        message: `Certificate chain validation failed for ${leafCert.certificateInfo.subject.dn.DN}.`,
        certificateChain: x5cOrdereredChain.map((cert) => cert.certificateInfo),
        detailMessage: `Verification of the certificate ${currentCert.certificateInfo.subject.dn.DN} with issuer ${
          currentCert.x509Certificate.issuer
        } failed. Public key: ${JSON.stringify(currentCert.certificateInfo.publicKeyJWK)}.`,
        verificationTime,
        ...(client && { client }),
      }
    }

    foundTrustAnchor = foundTrustAnchor ?? trustedCerts?.find((trusted) => isSameCertificate(trusted.x509Certificate, currentCert.x509Certificate))

    if (i === 0 && chainLength === 1 && allowSingleNoCAChainElement) {
      return {
        error: false,
        critical: false,
        message: `Certificate chain succeeded as allow single cert result is allowed: ${leafCert.certificateInfo.subject.dn.DN}.`,
        certificateChain: x5cOrdereredChain.map((cert) => cert.certificateInfo),
        trustAnchor: foundTrustAnchor?.certificateInfo,
        verificationTime,
        ...(client && { client }),
      }
    }
  }

  if (foundTrustAnchor?.certificateInfo || allowNoTrustAnchorsFound) {
    return {
      error: false,
      critical: false,
      message: `Certificate chain was valid`,
      certificateChain: x5cOrdereredChain.map((cert) => cert.certificateInfo),
      detailMessage: foundTrustAnchor
        ? `The leaf certificate ${leafCert.certificateInfo.subject.dn.DN} is part of a chain with trust anchor ${foundTrustAnchor?.certificateInfo.subject.dn.DN}.`
        : `The leaf certificate ${leafCert.certificateInfo.subject.dn.DN} and chain were valid, but no trust anchor has been found. Ignoring as user allowed (allowNoTrustAnchorsFound: ${allowNoTrustAnchorsFound}).)`,
      trustAnchor: foundTrustAnchor?.certificateInfo,
      verificationTime,
      ...(client && { client }),
    }
  }

  return {
    error: true,
    critical: true,
    message: `Certificate chain validation failed for ${leafCert.certificateInfo.subject.dn.DN}.`,
    certificateChain: x5cOrdereredChain.map((cert) => cert.certificateInfo),
    detailMessage: `No trust anchor was found in the chain. between (intermediate) CA ${
      x5cOrdereredChain[chain.length - 1].certificateInfo.subject.dn.DN
    } and leaf ${x5cOrdereredChain[0].certificateInfo.subject.dn.DN}.`,
    verificationTime,
    ...(client && { client }),
  }
}

const isSameCertificate = (cert1: X509Certificate, cert2: X509Certificate): boolean => {
  return cert1.rawData.toString() === cert2.rawData.toString()
}

const algorithmProvider: AlgorithmProvider = container.resolve(AlgorithmProvider)
export const getX509AlgorithmProvider = (): AlgorithmProvider => {
  return algorithmProvider
}

export type ParsedCertificate = {
  publicKeyInfo: SubjectPublicKeyInfo
  publicKeyJwk?: JWK
  publicKeyRaw: Uint8Array
  // @ts-ignore
  publicKeyAlgorithm: Algorithm
  certificateInfo: CertificateInfo
  certificate: Certificate
  x509Certificate: X509Certificate
}

export const parseCertificate = async (rawCert: string | Uint8Array): Promise<ParsedCertificate> => {
  const x509Certificate = new X509Certificate(rawCert)
  const publicKeyInfo = AsnParser.parse(x509Certificate.publicKey.rawData, SubjectPublicKeyInfo)
  const publicKeyRaw = new Uint8Array(publicKeyInfo.subjectPublicKey)
  let publicKeyJwk: JWK | undefined = undefined
  try {
    publicKeyJwk = (await getCertificateSubjectPublicKeyJWK(new Uint8Array(x509Certificate.rawData))) as JWK
  } catch (e: any) {
    console.error(e.message)
  }
  const certificate = pemOrDerToX509Certificate(rawCert)
  const certificateInfo = await getCertificateInfo(certificate)
  const publicKeyAlgorithm = getX509AlgorithmProvider().toWebAlgorithm(publicKeyInfo.algorithm)
  return {
    publicKeyAlgorithm,
    publicKeyInfo,
    publicKeyJwk,
    publicKeyRaw,
    certificateInfo,
    certificate,
    x509Certificate,
  }
}
/*

/!**
 *
 * @param pemOrDerChain The order must be that the Certs signing another cert must come one after another. So first the signing cert, then any cert signing that cert and so on
 * @param trustedPEMs
 * @param verificationTime
 * @param opts
 *!/
export const validateX509CertificateChainOrg = async ({
                                                          chain: pemOrDerChain,
                                                          trustAnchors,
                                                          verificationTime = new Date(),
                                                          opts = {
                                                              trustRootWhenNoAnchors: false,
                                                              allowSingleNoCAChainElement: true,
                                                              blindlyTrustedAnchors: [],
                                                          },
                                                      }: {
    chain: (Uint8Array | string)[]
    trustAnchors?: string[]
    verificationTime?: Date
    opts?: X509CertificateChainValidationOpts
}): Promise<X509ValidationResult> => {
    const {
        trustRootWhenNoAnchors = false,
        allowSingleNoCAChainElement = true,
        blindlyTrustedAnchors = [],
        client
    } = opts
    const trustedPEMs = trustRootWhenNoAnchors && !trustAnchors ? [pemOrDerChain[pemOrDerChain.length - 1]] : trustAnchors

    if (pemOrDerChain.length === 0) {
        return {
            error: true,
            critical: true,
            message: 'Certificate chain in DER or PEM format must not be empty',
            verificationTime,
        }
    }

    // x5c always starts with the leaf cert at index 0 and then the cas. Our internal pkijs service expects it the other way around
    const certs = pemOrDerChain.map(pemOrDerToX509Certificate).reverse()
    const trustedCerts = trustedPEMs ? trustedPEMs.map(pemOrDerToX509Certificate) : undefined
    defaultCryptoEngine()

    if (pemOrDerChain.length === 1) {
        const singleCert = typeof pemOrDerChain[0] === 'string' ? pemOrDerChain[0] : u8a.toString(pemOrDerChain[0], 'base64pad')
        const cert = pemOrDerToX509Certificate(singleCert)
        if (client) {
            const validation = await validateCertificateChainMatchesClientIdScheme(cert, client.clientId, client.clientIdScheme)
            if (validation.error) {
                return validation
            }
        }
        if (blindlyTrustedAnchors.includes(singleCert)) {
            console.log(`Certificate chain validation success as single cert if blindly trusted. WARNING: ONLY USE FOR TESTING PURPOSES.`)
            return {
                error: false,
                critical: true,
                message: `Certificate chain validation success as single cert if blindly trusted. WARNING: ONLY USE FOR TESTING PURPOSES.`,
                verificationTime,
                certificateChain: [await getCertificateInfo(cert)],
                ...(client && {client}),
            }
        }
        if (allowSingleNoCAChainElement) {
            const subjectDN = getSubjectDN(cert).DN
            if (!getIssuerDN(cert).DN || getIssuerDN(cert).DN === subjectDN) {
                const passed = await cert.verify()
                return {
                    error: !passed,
                    critical: true,
                    message: `Certificate chain validation for ${subjectDN}: ${passed ? 'successful' : 'failed'}.`,
                    verificationTime,
                    certificateChain: [await getCertificateInfo(cert)],
                    ...(client && {client}),
                }
            }
        }
    }

    const validationEngine = new CertificateChainValidationEngine({
        certs /!*crls: [crl1],   ocsps: [ocsp1], *!/,
        checkDate: verificationTime,
        trustedCerts,
    })

    try {
        const verification = await validationEngine.verify()
        if (!verification.result || !verification.certificatePath) {
            return {
                error: true,
                critical: true,
                message: verification.resultMessage !== '' ? verification.resultMessage : `Certificate chain validation failed.`,
                verificationTime,
                ...(client && {client}),
            }
        }
        const certPath = verification.certificatePath
        if (client) {
            const clientIdValidation = await validateCertificateChainMatchesClientIdScheme(certs[0], client.clientId, client.clientIdScheme)
            if (clientIdValidation.error) {
                return clientIdValidation
            }
        }
        let certInfos: Array<CertificateInfo> | undefined

        for (const certificate of certPath) {
            try {
                certInfos?.push(await getCertificateInfo(certificate))
            } catch (e: any) {
                console.log(`Error getting certificate info ${e.message}`)
            }
        }


        return {
            error: false,
            critical: false,
            message: `Certificate chain was valid`,
            verificationTime,
            certificateChain: certInfos,
            ...(client && {client}),
        }
    } catch (error: any) {
        return {
            error: true,
            critical: true,
            message: `Certificate chain was invalid, ${error.message ?? '<unknown error>'}`,
            verificationTime,
            ...(client && {client}),
        }
    }
}
*/

const rdnmap: Record<string, string> = {
  '2.5.4.6': 'C',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.3': 'CN',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.12': 'T',
  '2.5.4.42': 'GN',
  '2.5.4.43': 'I',
  '2.5.4.4': 'SN',
  '1.2.840.113549.1.9.1': 'E-mail',
}

export const getIssuerDN = (cert: Certificate): DNInfo => {
  return {
    DN: getDNString(cert.issuer.typesAndValues),
    attributes: getDNObject(cert.issuer.typesAndValues),
  }
}

export const getSubjectDN = (cert: Certificate): DNInfo => {
  return {
    DN: getDNString(cert.subject.typesAndValues),
    attributes: getDNObject(cert.subject.typesAndValues),
  }
}

const getDNObject = (typesAndValues: AttributeTypeAndValue[]): Record<string, string> => {
  const DN: Record<string, string> = {}
  for (const typeAndValue of typesAndValues) {
    const type = rdnmap[typeAndValue.type] ?? typeAndValue.type
    DN[type] = typeAndValue.value.getValue()
  }
  return DN
}
const getDNString = (typesAndValues: AttributeTypeAndValue[]): string => {
  return Object.entries(getDNObject(typesAndValues))
    .map(([key, value]) => `${key}=${value}`)
    .join(',')
}

export const getCertificateSubjectPublicKeyJWK = async (pemOrDerCert: string | Uint8Array | Certificate): Promise<JWK> => {
  const pemOrDerStr =
    typeof pemOrDerCert === 'string'
      ? toString(fromString(pemOrDerCert, 'base64pad'), 'base64pad')
      : pemOrDerCert instanceof Uint8Array
      ? toString(pemOrDerCert, 'base64pad')
      : toString(fromString(pemOrDerCert.toString('base64'), 'base64pad'), 'base64pad')
  const pem = derToPEM(pemOrDerStr)
  const certificate = pemOrDerToX509Certificate(pem)
  var jwk: JWK | undefined
  try {
    const subtle = getCrypto(true).subtle
    const pk = await certificate.getPublicKey(undefined, defaultCryptoEngine())
    jwk = (await subtle.exportKey('jwk', pk)) as JWK | undefined
  } catch (error: any) {
    console.log(`Error in primary get JWK from cert:`, error?.message)
  }
  if (!jwk) {
    try {
      jwk = (await x509.toJwk(pem, 'pem')) as JWK
    } catch (error: any) {
      console.log(`Error in secondary get JWK from cert as well:`, error?.message)
    }
  }
  if (!jwk) {
    throw Error(`Failed to get JWK from certificate ${pem}`)
  }
  return jwk
}

/**
 *  otherName                       [0]     OtherName,
 *         rfc822Name                      [1]     IA5String,
 *         dNSName                         [2]     IA5String,
 *         x400Address                     [3]     ORAddress,
 *         directoryName                   [4]     Name,
 *         ediPartyName                    [5]     EDIPartyName,
 *         uniformResourceIdentifier       [6]     IA5String,
 *         iPAddress                       [7]     OCTET STRING,
 *         registeredID                    [8]     OBJECT IDENTIFIER }
 */
export enum SubjectAlternativeGeneralName {
  rfc822Name = 1, // email
  dnsName = 2,
  uniformResourceIdentifier = 6,
  ipAddress = 7,
}

export interface SubjectAlternativeName {
  value: string
  type: SubjectAlternativeGeneralName
}

export type ClientIdScheme = 'x509_san_dns' | 'x509_san_uri'

export const assertCertificateMatchesClientIdScheme = (certificate: Certificate, clientId: string, clientIdScheme: ClientIdScheme): void => {
  const sans = getSubjectAlternativeNames(certificate, { clientIdSchemeFilter: clientIdScheme })
  const clientIdMatches = sans.find((san) => san.value === clientId)
  if (!clientIdMatches) {
    throw Error(
      `Client id scheme ${clientIdScheme} used had no matching subject alternative names in certificate with DN ${
        getSubjectDN(certificate).DN
      }. SANS: ${sans.map((san) => san.value).join(',')}`
    )
  }
}

export const validateCertificateChainMatchesClientIdScheme = async (
  certificate: Certificate,
  clientId: string,
  clientIdScheme: ClientIdScheme
): Promise<X509ValidationResult> => {
  const result = {
    error: true,
    critical: true,
    message: `Client Id ${clientId} was not present in certificate using scheme ${clientIdScheme}`,
    client: {
      clientId,
      clientIdScheme,
    },
    certificateChain: [await getCertificateInfo(certificate)],
    verificationTime: new Date(),
  }
  try {
    assertCertificateMatchesClientIdScheme(certificate, clientId, clientIdScheme)
  } catch (error) {
    return result
  }
  result.error = false
  result.message = `Client Id ${clientId} was present in certificate using scheme ${clientIdScheme}`
  return result
}

export const getSubjectAlternativeNames = (
  certificate: Certificate,
  opts?: {
    typeFilter?: SubjectAlternativeGeneralName | SubjectAlternativeGeneralName[]
    // When a clientIdchemeFilter is passed in it will always override the above type filter
    clientIdSchemeFilter?: ClientIdScheme
  }
): SubjectAlternativeName[] => {
  let typeFilter: SubjectAlternativeGeneralName[]
  if (opts?.clientIdSchemeFilter) {
    typeFilter =
      opts.clientIdSchemeFilter === 'x509_san_dns'
        ? [SubjectAlternativeGeneralName.dnsName]
        : [SubjectAlternativeGeneralName.uniformResourceIdentifier]
  } else if (opts?.typeFilter) {
    typeFilter = Array.isArray(opts.typeFilter) ? opts.typeFilter : [opts.typeFilter]
  } else {
    typeFilter = [SubjectAlternativeGeneralName.dnsName, SubjectAlternativeGeneralName.uniformResourceIdentifier]
  }
  const parsedValue = certificate.extensions?.find((ext) => ext.extnID === id_SubjectAltName)?.parsedValue as AltName
  if (!parsedValue) {
    return []
  }
  const altNames = parsedValue.toJSON().altNames
  return altNames
    .filter((altName) => typeFilter.includes(altName.type))
    .map((altName) => {
      return { type: altName.type, value: altName.value } satisfies SubjectAlternativeName
    })
}
