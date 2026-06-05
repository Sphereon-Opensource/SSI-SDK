import mdocPkg from '@sphereon/kmp-mdoc-core'
import { IVerifySdJwtVcResult } from '@sphereon/ssi-sdk.sd-jwt'
import {
  CredentialMapper,
  ICredentialSchemaType,
  IVerifyResult,
  OriginalVerifiableCredential,
  WrappedVerifiableCredential,
} from '@sphereon/ssi-types'
import { IAgentPlugin, IVerifyCredentialArgs, W3CVerifiableCredential as VeramoW3CVerifiableCredential } from '@veramo/core'
import addFormats from 'ajv-formats'
import Ajv2020 from 'ajv/dist/2020.js'
import fetch from 'cross-fetch'
import {
  CredentialVerificationError,
  ICredentialValidation,
  RequiredContext,
  schema,
  SchemaValidation,
  ValidateSchemaArgs,
  VerificationResult,
  VerificationSubResult,
  VerifyCredentialArgs,
  VerifyMdocCredentialArgs,
  VerifySDJWTCredentialArgs,
} from '../index'
import IVerifySignatureResult = mdocPkg.com.sphereon.crypto.generic.IVerifySignatureResult
import ICoseKeyJson = mdocPkg.com.sphereon.crypto.cose.ICoseKeyJson
import decodeFrom = mdocPkg.com.sphereon.kmp.decodeFrom
import IssuerSignedCbor = mdocPkg.com.sphereon.mdoc.data.device.IssuerSignedCbor
import { defaultHasher } from '@sphereon/ssi-sdk.core'

// Exposing the methods here for any REST implementation
export const credentialValidationMethods: Array<string> = [
  'cvVerifyCredential',
  'cvVerifySchema',
  'cvVerifyMdoc',
  'cvVerifySDJWTCredential',
  'cvVerifyW3CCredential',
]

/**
 * {@inheritDoc ICredentialValidation}
 */
export class CredentialValidation implements IAgentPlugin {
  readonly schema = schema.ICredentialValidation
  readonly methods: ICredentialValidation = {
    cvVerifyCredential: this.cvVerifyCredential.bind(this),
    cvVerifySchema: this.cvVerifySchema.bind(this),
    cvVerifyMdoc: this.cvVerifyMdoc.bind(this),
    cvVerifySDJWTCredential: this.cvVerifySDJWTCredential.bind(this),
    cvVerifyW3CCredential: this.cvVerifyW3CCredential.bind(this),
  }

  private detectSchemas(wrappedVC: WrappedVerifiableCredential): ICredentialSchemaType[] | undefined {
    if ('credential' in wrappedVC) {
      const { credential } = wrappedVC

      if ('credentialSchema' in credential) {
        const { credentialSchema } = credential

        if (Array.isArray(credentialSchema)) {
          return credentialSchema
        } else if (credentialSchema) {
          return [credentialSchema]
        }
      }
    }

    return undefined
  }

  private async cvVerifyCredential(args: VerifyCredentialArgs, context: RequiredContext): Promise<VerificationResult> {
    const { credential, hasher = defaultHasher, policies } = args
    // defaulting the schema validation to when_present
    const schemaResult = await this.cvVerifySchema({
      credential,
      validationPolicy: policies?.schemaValidation ?? SchemaValidation.WHEN_PRESENT,
      hasher,
    })
    if (!schemaResult.result) {
      return schemaResult
    }
    if (CredentialMapper.isMsoMdocOid4VPEncoded(credential)) {
      return await this.cvVerifyMdoc({ credential }, context)
    } else if (CredentialMapper.isSdJwtEncoded(credential)) {
      // Honor the credentialStatus policy: when status checking is disabled (e.g. during issuance), skip the
      // status-list token verification so an untrusted status-list signer cannot block a valid credential.
      return await this.cvVerifySDJWTCredential({ credential, hasher, skipStatusCheck: policies?.credentialStatus === false }, context)
    } else {
      return await this.cvVerifyW3CCredential(
        {
          ...args,
          credential: credential as VeramoW3CVerifiableCredential,
        },
        context,
      )
    }
  }

  private async cvVerifySchema(args: ValidateSchemaArgs): Promise<VerificationResult> {
    const { credential, hasher = defaultHasher, validationPolicy } = args
    const wrappedCredential: WrappedVerifiableCredential = CredentialMapper.toWrappedVerifiableCredential(credential, { hasher })
    if (validationPolicy === SchemaValidation.NEVER) {
      return {
        result: true,
        source: wrappedCredential,
        subResults: [],
      }
    }
    return this.validateSchema(wrappedCredential, validationPolicy)
  }

  private async validateSchema(wrappedVC: WrappedVerifiableCredential, validationPolicy?: SchemaValidation): Promise<VerificationResult> {
    const schemas: ICredentialSchemaType[] | undefined = this.detectSchemas(wrappedVC)
    if (!schemas) {
      if (validationPolicy === SchemaValidation.ALWAYS) {
        console.error(
          `No schema found for credential, but validation policy is set to ALWAYS. Returning false. Credential: ${JSON.stringify(wrappedVC.credential, null, 2)}`,
        )
        return {
          result: false,
          source: wrappedVC,
          subResults: [],
        }
      } else {
        return {
          result: true,
          source: wrappedVC,
          subResults: [],
        }
      }
    }

    const subResults: VerificationSubResult[] = await Promise.all(schemas.map((schema) => this.verifyCredentialAgainstSchema(wrappedVC, schema)))

    return {
      result: subResults.every((subResult) => subResult.result),
      source: wrappedVC,
      subResults,
    }
  }

  private async fetchSchema(uri: string) {
    const response = await fetch(uri)
    if (!response.ok) {
      throw new Error(`Unable to fetch schema from ${uri}`)
    }
    return response.json()
  }

  private async verifyCredentialAgainstSchema(wrappedVC: WrappedVerifiableCredential, schema: ICredentialSchemaType): Promise<VerificationSubResult> {
    const schemaUrl: string = typeof schema === 'string' ? schema : schema.id
    let schemaValue
    try {
      schemaValue = await this.fetchSchema(schemaUrl)
    } catch (error) {
      console.error(error)
      return {
        result: false,
        error: error,
      }
    }

    const ajv = new Ajv2020({ loadSchema: this.fetchSchema })
    addFormats(ajv)

    const validate = await ajv.compileAsync(schemaValue)
    const valid = validate(wrappedVC.credential)
    if (!valid) {
      console.error(`Schema validation failed for `, wrappedVC.credential)
    }
    return {
      result: valid,
    }
  }

  private async cvVerifyMdoc(args: VerifyMdocCredentialArgs, context: RequiredContext): Promise<VerificationResult> {
    const { credential } = args

    const rawBytes = decodeFrom(credential, mdocPkg.com.sphereon.kmp.Encoding.BASE64URL)
    // Stash raw mdoc bytes so @sphereon/ssi-sdk.mdl-mdoc's verify1Async can rebuild Sig_structure
    // from the untouched protected/payload bytes, working around the kmp-mdoc-core UTF-8 string
    // round-trip that corrupts binary protected-header values (e.g. a bstr kid).
    const u8Raw: Uint8Array =
      rawBytes instanceof Uint8Array
        ? rawBytes
        : ArrayBuffer.isView(rawBytes)
          ? new Uint8Array((rawBytes as ArrayBufferView).buffer, (rawBytes as ArrayBufferView).byteOffset, (rawBytes as ArrayBufferView).byteLength)
          : Uint8Array.from((rawBytes as unknown as number[]).map((b) => b & 0xff))
    const g = globalThis as unknown as { __sphereon_mdoc_raw_bytes?: Uint8Array }
    const prevRaw = g.__sphereon_mdoc_raw_bytes
    g.__sphereon_mdoc_raw_bytes = u8Raw
    let verification: IVerifySignatureResult<ICoseKeyJson>
    try {
      const issuerSigned = IssuerSignedCbor.Static.cborDecode(rawBytes)
      verification = await context.agent.mdocVerifyIssuerSigned({ input: issuerSigned.toJson().issuerAuth }).catch((error: Error) => {
        console.error(error)
        return {
          name: 'mdoc',
          critical: true,
          error: true,
          message: error.message ?? 'Mdoc Issuer Signed VC could not be verified',
        } satisfies IVerifySignatureResult<ICoseKeyJson>
      })
    } finally {
      g.__sphereon_mdoc_raw_bytes = prevRaw
    }

    return {
      source: CredentialMapper.toWrappedVerifiableCredential(credential as OriginalVerifiableCredential, { hasher: defaultHasher }),
      result: !verification.error,
      subResults: [],
      ...(verification.error && {
        error: verification.message ?? `Could not verify mdoc from issuer`,
      }),
    }
  }

  private async cvVerifyW3CCredential(args: IVerifyCredentialArgs, context: RequiredContext): Promise<VerificationResult> {
    // We also allow/add boolean, because 4.x Veramo returns a boolean for JWTs. 5.X will return better results
    const { credential, policies } = args

    const result: IVerifyResult | boolean = (await context.agent.verifyCredential(args)) as IVerifyResult | boolean

    if (typeof result === 'boolean') {
      return {
        // FIXME the source is never used, need to start using this as the source of truth
        source: CredentialMapper.toWrappedVerifiableCredential(args.credential as OriginalVerifiableCredential, { hasher: defaultHasher }),
        result,
        ...(!result && {
          error: 'Invalid JWT VC',
          errorDetails: `JWT VC was not valid with policies: ${JSON.stringify(policies)}`,
        }),
        subResults: [],
      }
    } else {
      // TODO look at what this is doing and make it simple and readable
      let error: string | undefined
      let errorDetails: string | undefined
      const subResults: Array<VerificationSubResult> = []
      if (result.error) {
        error = result.error?.message ?? ''
        errorDetails = result.error?.details?.code ?? ''
        errorDetails = (errorDetails !== '' ? `${errorDetails}, ` : '') + (result.error?.details?.url ?? '')
        if (result.error?.errors) {
          error = (error !== '' ? `${error}, ` : '') + result.error?.errors?.map((error) => error.message ?? error.name).join(', ')
          errorDetails =
            (errorDetails !== '' ? `${errorDetails}, ` : '') +
            result.error?.errors?.map((error) => (error?.details?.code ? `${error.details.code}, ` : '') + (error?.details?.url ?? '')).join(', ')
        }
        console.error(error)
      }

      return {
        source: CredentialMapper.toWrappedVerifiableCredential(credential as OriginalVerifiableCredential, { hasher: defaultHasher }),
        result: result.verified,
        subResults,
        error,
        errorDetails,
      }
    }
  }

  private async cvVerifySDJWTCredential(args: VerifySDJWTCredentialArgs, context: RequiredContext): Promise<VerificationResult> {
    const { credential, hasher = defaultHasher, skipStatusCheck } = args

    const verification: IVerifySdJwtVcResult | CredentialVerificationError = await context.agent
      .verifySdJwtVc({ credential, opts: { skipStatusCheck } })
      .catch((error: Error): CredentialVerificationError => {
        console.error(error)
        // Distinguish a status-list verification failure (the status-list token's signer is untrusted/invalid)
        // from the credential's own signature failing, so the UI can show a clear, specific message. The
        // low-level lib tags status failures with "status list".
        const isStatusListFailure = /status list/i.test(error.message ?? '')
        return {
          error: isStatusListFailure ? 'Invalid status list' : 'Invalid SD-JWT VC',
          errorDetails: error.message ?? 'SD-JWT VC could not be verified',
        }
      })

    const result = 'header' in verification && 'payload' in verification
    return {
      source: CredentialMapper.toWrappedVerifiableCredential(credential as OriginalVerifiableCredential, { hasher: hasher ?? defaultHasher }),
      result,
      subResults: [],
      ...(!result && { ...verification }),
    }
  }
}
