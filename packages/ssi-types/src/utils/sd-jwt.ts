import { decodeSdJwt, decodeSdJwtSync, getClaims, getClaimsSync } from '@sd-jwt/decode'
import type {
  CompactSdJwtVc,
  Hasher,
  HasherSync,
  IVerifiableCredential,
  SdJwtDecodedDisclosure,
  SdJwtDecodedVerifiableCredential,
  SdJwtDecodedVerifiableCredentialPayload,
  SdJwtDisclosure,
  SdJwtSignedVerifiableCredentialPayload,
  SdJwtVcKbJwtHeader,
  SdJwtVcKbJwtPayload,
} from '../types'
import { IProofPurpose, IProofType } from './did'

/**
 * Decode an SD-JWT vc from its compact format (string) to an object containing the disclosures,
 * signed payload, decoded payload and the compact SD-JWT vc.
 *
 * Both the input and output interfaces of this method are defined in `@sphereon/ssi-types`, so
 * this method hides the actual implementation of SD-JWT (which is currently based on @sd-jwt/core)
 */
export function decodeSdJwtVc(compactSdJwtVc: CompactSdJwtVc, hasher: HasherSync): SdJwtDecodedVerifiableCredential {
  const { jwt, disclosures, kbJwt } = decodeSdJwtSync(compactSdJwtVc, hasher)

  const signedPayload = jwt.payload as SdJwtSignedVerifiableCredentialPayload
  const decodedPayload = getClaimsSync(signedPayload, disclosures, hasher)
  const compactKeyBindingJwt = kbJwt ? compactSdJwtVc.split('~').pop() : undefined

  return {
    compactSdJwtVc,
    decodedPayload: decodedPayload as SdJwtDecodedVerifiableCredentialPayload,
    disclosures: disclosures.map((d) => {
      const decoded = d.key ? [d.salt, d.key, d.value] : [d.salt, d.value]
      if (!d._digest) throw new Error('Implementation error: digest not present in disclosure')
      return {
        decoded: decoded as SdJwtDecodedDisclosure,
        digest: d._digest,
        encoded: d.encode(),
      } satisfies SdJwtDisclosure
    }),
    signedPayload: signedPayload as SdJwtSignedVerifiableCredentialPayload,
    ...(compactKeyBindingJwt &&
      kbJwt && {
        kbJwt: {
          header: kbJwt.header as SdJwtVcKbJwtHeader,
          compact: compactKeyBindingJwt,
          payload: kbJwt.payload as SdJwtVcKbJwtPayload,
        },
      }),
  }
}

/**
 * Decode an SD-JWT vc from its compact format (string) to an object containing the disclosures,
 * signed payload, decoded payload and the compact SD-JWT vc.
 *
 * Both the input and output interfaces of this method are defined in `@sphereon/ssi-types`, so
 * this method hides the actual implementation of SD-JWT (which is currently based on @sd-jwt/core)
 */
export async function decodeSdJwtVcAsync(compactSdJwtVc: CompactSdJwtVc, hasher: Hasher): Promise<SdJwtDecodedVerifiableCredential> {
  const { jwt, disclosures, kbJwt } = await decodeSdJwt(compactSdJwtVc, hasher)

  const signedPayload = jwt.payload as SdJwtSignedVerifiableCredentialPayload
  const decodedPayload = await getClaims(signedPayload, disclosures, hasher)
  const compactKeyBindingJwt = kbJwt ? compactSdJwtVc.split('~').pop() : undefined

  return {
    compactSdJwtVc,
    decodedPayload: decodedPayload as SdJwtDecodedVerifiableCredentialPayload,
    disclosures: disclosures.map((d) => {
      const decoded = d.key ? [d.salt, d.key, d.value] : [d.salt, d.value]
      if (!d._digest) throw new Error('Implementation error: digest not present in disclosure')
      return {
        decoded: decoded as SdJwtDecodedDisclosure,
        digest: d._digest,
        encoded: d.encode(),
      } satisfies SdJwtDisclosure
    }),
    signedPayload: signedPayload as SdJwtSignedVerifiableCredentialPayload,
    ...(compactKeyBindingJwt &&
      kbJwt && {
        kbJwt: {
          header: kbJwt.header as SdJwtVcKbJwtHeader,
          payload: kbJwt.payload as SdJwtVcKbJwtPayload,
          compact: compactKeyBindingJwt,
        },
      }),
  }
}

export const sdJwtDecodedCredentialToUniformCredential = (
  decoded: SdJwtDecodedVerifiableCredential,
  opts?: { maxTimeSkewInMS?: number },
): IVerifiableCredential => {
  const { decodedPayload } = decoded
  const { exp, nbf, iss, iat, vct, cnf, status, sub, jti } = decodedPayload

  const maxSkewInMS = opts?.maxTimeSkewInMS ?? 1500

  const expirationDate = jwtDateToISOString({ jwtClaim: exp, claimName: 'exp' })
  let issuanceDateStr = jwtDateToISOString({ jwtClaim: iat, claimName: 'iat' })

  let nbfDateAsStr: string | undefined
  if (nbf) {
    nbfDateAsStr = jwtDateToISOString({ jwtClaim: nbf, claimName: 'nbf' })
    if (issuanceDateStr && nbfDateAsStr && issuanceDateStr !== nbfDateAsStr) {
      const diff = Math.abs(new Date(nbfDateAsStr).getTime() - new Date(iss).getTime())
      if (!maxSkewInMS || diff > maxSkewInMS) {
        throw Error(`Inconsistent issuance dates between JWT claim (${nbfDateAsStr}) and VC value (${iss})`)
      }
    }
    issuanceDateStr = nbfDateAsStr
  }
  const issuanceDate = issuanceDateStr
  if (!issuanceDate) {
    throw Error(`JWT issuance date is required but was not present`)
  }

  // Filter out the fields we don't want in credentialSubject
  const excludedFields = new Set(['vct', 'cnf', 'iss', 'iat', 'exp', 'nbf', 'jti', 'sub'])
  const credentialSubject = Object.entries(decodedPayload).reduce(
    (acc, [key, value]) => {
      if (
        !excludedFields.has(key) &&
        value !== undefined &&
        value !== '' &&
        !(typeof value === 'object' && value !== null && Object.keys(value).length === 0)
      ) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, any>,
  )

  const credential: Omit<IVerifiableCredential, 'issuer' | 'issuanceDate'> = {
    type: [vct], // SDJwt is not a W3C VC, so no VerifiableCredential
    '@context': [], // SDJwt has no JSON-LD by default. Certainly not the VC DM1 default context for JSON-LD
    credentialSubject: {
      ...credentialSubject,
      id: credentialSubject.id ?? sub ?? jti,
    },
    issuanceDate,
    expirationDate,
    issuer: iss,
    ...(cnf && { cnf }),
    ...(status && { status }),
    proof: {
      type: IProofType.SdJwtProof2024,
      created: nbfDateAsStr ?? issuanceDate,
      proofPurpose: IProofPurpose.authentication,
      verificationMethod: iss,
      jwt: decoded.compactSdJwtVc,
    },
  }

  return credential as IVerifiableCredential
}

const jwtDateToISOString = ({
  jwtClaim,
  claimName,
  isRequired = false,
}: {
  jwtClaim?: number
  claimName: string
  isRequired?: boolean
}): string | undefined => {
  if (jwtClaim) {
    const claim = parseInt(jwtClaim.toString())
    // change JWT seconds to millisecond for the date
    return new Date(claim * (claim < 9999999999 ? 1000 : 1)).toISOString().replace(/\.000Z/, 'Z')
  } else if (isRequired) {
    throw Error(`JWT claim ${claimName} is required but was not present`)
  }
  return undefined
}
