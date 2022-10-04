import {
  ClaimFormat,
  ICredential,
  IPresentation,
  IVerifiableCredential,
  IVerifiablePresentation,
  JwtDecodedVerifiableCredential,
  JwtDecodedVerifiablePresentation,
  OriginalType,
  OriginalVerifiableCredential,
  OriginalVerifiablePresentation,
  WrappedVerifiableCredential,
  WrappedVerifiablePresentation,
} from '../types'
import jwt_decode from 'jwt-decode'
import { ObjectUtils } from '../utils'

export class CredentialMapper {
  static decodeVerifiablePresentation(presentation: OriginalVerifiablePresentation): JwtDecodedVerifiablePresentation | IVerifiablePresentation {
    if (CredentialMapper.isJwtEncoded(presentation)) {
      return jwt_decode(presentation as string) as JwtDecodedVerifiablePresentation
    } else if (CredentialMapper.isJwtDecodedPresentation(presentation)) {
      return presentation as JwtDecodedVerifiablePresentation
    } else if (CredentialMapper.isJsonLdString(presentation)) {
      return JSON.parse(presentation as string) as IVerifiablePresentation
    } else {
      return presentation as IVerifiablePresentation
    }
  }

  static decodeVerifiableCredential(credential: OriginalVerifiableCredential): JwtDecodedVerifiableCredential | IVerifiableCredential {
    if (CredentialMapper.isJwtEncoded(credential)) {
      return jwt_decode(credential as string) as JwtDecodedVerifiableCredential
    } else if (CredentialMapper.isJwtDecodedCredential(credential)) {
      return credential as JwtDecodedVerifiableCredential
    } else if (CredentialMapper.isJsonLdString(credential)) {
      return JSON.parse(credential as string) as IVerifiableCredential
    } else {
      return credential as IVerifiableCredential
    }
  }

  static toWrappedVerifiablePresentation(presentation: OriginalVerifiablePresentation): WrappedVerifiablePresentation {
    const original = presentation
    const isJwtEncoded: boolean = CredentialMapper.isJwtEncoded(original)
    const isJwtDecoded: boolean = CredentialMapper.isJwtDecodedPresentation(original)

    const type = isJwtEncoded ? OriginalType.JWT_ENCODED : isJwtDecoded ? OriginalType.JWT_DECODED : OriginalType.JSONLD
    const format: ClaimFormat = isJwtDecoded || isJwtEncoded ? 'jwt_vp' : 'ldp_vp'
    const decoded = CredentialMapper.decodeVerifiablePresentation(original)
    const vp: IPresentation =
      isJwtEncoded || isJwtDecoded
        ? CredentialMapper.jwtDecodedPresentationToUniformPresentation(decoded as JwtDecodedVerifiablePresentation, false)
        : (decoded as IPresentation)
    const vcs: WrappedVerifiableCredential[] = CredentialMapper.toWrappedVerifiableCredentials(vp.verifiableCredential)

    // todo: We probably want to add proofs as well
    return {
      type,
      format,
      original,
      decoded,
      presentation: {
        ...vp,
        verifiableCredential: vcs, // We overwrite the credentials with wrapped versions, making it an InternalVerifiablePresentation. Note: we keep the singular key name of the vc data model
      },
      vcs,
    }
  }

  static toWrappedVerifiableCredentials(verifiableCredentials: OriginalVerifiableCredential[]): WrappedVerifiableCredential[] {
    return verifiableCredentials.map(CredentialMapper.toWrappedVerifiableCredential)
  }

  static toWrappedVerifiableCredential(verifiableCredential: OriginalVerifiableCredential): WrappedVerifiableCredential {
    const original = verifiableCredential

    const decoded = CredentialMapper.decodeVerifiableCredential(verifiableCredential)

    const isJwtEncoded = CredentialMapper.isJwtEncoded(original)
    const isJwtDecoded = CredentialMapper.isJwtDecodedCredential(original)
    const type = isJwtEncoded ? OriginalType.JWT_ENCODED : isJwtDecoded ? OriginalType.JWT_DECODED : OriginalType.JSONLD

    const credential =
      isJwtDecoded || isJwtDecoded
        ? CredentialMapper.jwtDecodedCredentialToUniformCredential(decoded as JwtDecodedVerifiableCredential)
        : (decoded as ICredential)
    const format = isJwtDecoded || isJwtDecoded ? 'jwt_vc' : 'ldp_vc'
    //todo: We probably want to add proofs as well
    return {
      original,
      decoded,
      format,
      type,
      credential,
    }
  }

  public static isJwtEncoded(original: OriginalVerifiableCredential | OriginalVerifiablePresentation) {
    return ObjectUtils.isString(original) && (original as string).startsWith('ey')
  }

  private static isJsonLdString(original: OriginalVerifiableCredential | OriginalVerifiablePresentation) {
    return ObjectUtils.isString(original) && (original as string).includes('@context')
  }

  public static isJwtDecodedCredential(original: OriginalVerifiableCredential): boolean {
    return (<JwtDecodedVerifiableCredential>original)['vc'] !== undefined && (<JwtDecodedVerifiableCredential>original)['iss'] !== undefined
  }

  public static isJwtDecodedPresentation(original: OriginalVerifiablePresentation): boolean {
    return (<JwtDecodedVerifiablePresentation>original)['vp'] !== undefined && (<JwtDecodedVerifiablePresentation>original)['iss'] !== undefined
  }

  static jwtEncodedPresentationToUniformPresentation(jwt: string, makeCredentialsUniform: boolean = true): IPresentation {
    return CredentialMapper.jwtDecodedPresentationToUniformPresentation(jwt_decode(jwt), makeCredentialsUniform)
  }

  static jwtDecodedPresentationToUniformPresentation(
    decoded: JwtDecodedVerifiablePresentation,
    makeCredentialsUniform: boolean = true
  ): IPresentation {
    const presentation: IPresentation = {
      ...(decoded.vp as IPresentation),
    }
    if (makeCredentialsUniform) {
      presentation.verifiableCredential = decoded.vp.verifiableCredential.map(CredentialMapper.toUniformCredential) as IVerifiableCredential[] // We cast it because we IPresentation needs a VC. The internal Credential doesn't have the required Proof anymore (that is intended)
    }
    // Since this is a presentation, we delete any proof just to be sure (should not occur on JWT, but better safe than sorry)
    delete presentation.proof

    if (decoded.iss) {
      const holder = presentation.holder
      if (holder) {
        if (holder !== decoded.iss) {
          throw new Error(`Inconsistent holders between JWT claim (${decoded.iss}) and VC value (${holder})`)
        }
      }
      presentation.holder = decoded.iss
    }
    if (decoded.jti) {
      const id = presentation.id
      if (id && id !== decoded.jti) {
        throw new Error(`Inconsistent VP ids between JWT claim (${decoded.jti}) and VP value (${id})`)
      }
      presentation.id = decoded.jti
    }
    return presentation
  }

  static toUniformCredential(verifiableCredential: OriginalVerifiableCredential): ICredential {
    const original = verifiableCredential
    const decoded = CredentialMapper.decodeVerifiableCredential(verifiableCredential)

    const isJwtEncoded: boolean = CredentialMapper.isJwtEncoded(original)
    const isJwtDecoded: boolean = CredentialMapper.isJwtDecodedCredential(original)

    if (isJwtDecoded || isJwtEncoded) {
      return CredentialMapper.jwtDecodedCredentialToUniformCredential(decoded as JwtDecodedVerifiableCredential)
    } else {
      return decoded as ICredential
    }
  }

  static toUniformPresentation(presentation: OriginalVerifiablePresentation): IPresentation {
    const original = presentation
    const decoded = CredentialMapper.decodeVerifiablePresentation(original)
    const isJwtEncoded: boolean = CredentialMapper.isJwtEncoded(original)
    const isJwtDecoded: boolean = CredentialMapper.isJwtDecodedPresentation(original)
    const uniformPresentation =
      isJwtEncoded || isJwtDecoded
        ? CredentialMapper.jwtDecodedPresentationToUniformPresentation(decoded as JwtDecodedVerifiablePresentation, false)
        : (decoded as IPresentation)
    uniformPresentation.verifiableCredential = uniformPresentation.verifiableCredential?.map(
      CredentialMapper.toUniformCredential
    ) as IVerifiableCredential[] // We cast it because we IPresentation needs a VC. The internal Credential doesn't have the required Proof anymore (that is intended)
    return uniformPresentation
  }

  static jwtEncodedCredentialToUniformCredential(jwt: string): ICredential {
    return CredentialMapper.jwtDecodedCredentialToUniformCredential(jwt_decode(jwt))
  }

  static jwtDecodedCredentialToUniformCredential(decoded: JwtDecodedVerifiableCredential): ICredential {
    const credential: ICredential = {
      ...(decoded.vc as ICredential),
    }
    // Since this is a credential, we delete any proof just to be sure (should not occur on JWT, but better safe than sorry)
    delete credential.proof

    if (decoded.exp) {
      const expDate = credential.expirationDate
      const jwtExp = parseInt(decoded.exp.toString())
      // fix seconds to millisecs for the date
      const expDateAsStr = jwtExp < 9999999999 ? new Date(jwtExp * 1000).toISOString().replace(/\.000Z/, 'Z') : new Date(jwtExp).toISOString()
      if (expDate && expDate !== expDateAsStr) {
        throw new Error(`Inconsistent expiration dates between JWT claim (${expDateAsStr}) and VC value (${expDate})`)
      }
      credential.expirationDate = expDateAsStr
    }

    if (decoded.nbf) {
      const issuanceDate = credential.issuanceDate
      const jwtNbf = parseInt(decoded.nbf.toString())
      // fix seconds to millisecs for the date
      const nbfDateAsStr = jwtNbf < 9999999999 ? new Date(jwtNbf * 1000).toISOString().replace(/\.000Z/, 'Z') : new Date(jwtNbf).toISOString()
      if (issuanceDate && issuanceDate !== nbfDateAsStr) {
        throw new Error(`Inconsistent issuance dates between JWT claim (${nbfDateAsStr}) and VC value (${issuanceDate})`)
      }
      credential.issuanceDate = nbfDateAsStr
    }

    if (decoded.iss) {
      const issuer = credential.issuer
      if (issuer) {
        if (typeof issuer === 'string') {
          if (issuer !== decoded.iss) {
            throw new Error(`Inconsistent issuers between JWT claim (${decoded.iss}) and VC value (${issuer})`)
          }
        } else {
          if (issuer.id !== decoded.iss) {
            throw new Error(`Inconsistent issuers between JWT claim (${decoded.iss}) and VC value (${issuer.id})`)
          }
        }
      }
      credential.issuer = decoded.iss
    }

    if (decoded.sub) {
      const subjects = Array.isArray(credential.credentialSubject) ? credential.credentialSubject : [credential.credentialSubject]
      for (let i = 0; i < subjects.length; i++) {
        const csId = subjects[i].id
        if (csId && csId !== decoded.sub) {
          throw new Error(`Inconsistent credential subject ids between JWT claim (${decoded.sub}) and VC value (${csId})`)
        }
        Array.isArray(credential.credentialSubject)
          ? (credential.credentialSubject[i].id = decoded.sub)
          : (credential.credentialSubject.id = decoded.sub)
      }
    }
    if (decoded.jti) {
      const id = credential.id
      if (id && id !== decoded.jti) {
        throw new Error(`Inconsistent credential ids between JWT claim (${decoded.jti}) and VC value (${id})`)
      }
      credential.id = decoded.jti
    }
    return credential
  }
}
