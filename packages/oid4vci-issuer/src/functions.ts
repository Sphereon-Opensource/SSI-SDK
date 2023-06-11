import { CredentialIssuerMetadata, Jwt, OID4VCICredentialFormat, UniformCredentialRequest } from '@sphereon/oid4vci-common'
import { VcIssuer, VcIssuerBuilder } from '@sphereon/oid4vci-issuer'
import { getDID, IDIDOptions } from '@sphereon/ssi-sdk-ext.did-utils'
import { ICredential, W3CVerifiableCredential } from '@sphereon/ssi-types'
import { IIdentifier, ProofFormat } from '@veramo/core'
import { CredentialPayload } from '@veramo/core/src/types/vc-data-model'
import { bytesToBase64 } from '@veramo/utils'
import { IIssuerOptions, IRequiredContext } from './types/IOID4VCIIssuer'
import { verifyJWT, decodeJWT, JWTVerifyOptions, createJWT } from 'did-jwt'
import { CredentialDataSupplier } from '@sphereon/oid4vci-issuer'

function getJwtVerifyCallback({ verifyOpts }: { verifyOpts?: JWTVerifyOptions }, _context: IRequiredContext) {
  return async (args: { jwt: string; kid?: string }): Promise<Jwt> => {
    const result = await verifyJWT(args.jwt, verifyOpts)
    if (!result.verified) {
      console.log(`JWT invalid: ${args.jwt}`)
      throw Error('JWT did not verify successfully')
    }
    return (await decodeJWT(args.jwt)) as Jwt
  }
}

export function getAccessTokenSignerCallback(opts: { iss?: string; keyRef?: string; didOpts?: IDIDOptions }, context: IRequiredContext) {
  //fixme first key only when did is identifier
  const keyRef =
    opts.keyRef ??
    opts.didOpts?.identifierOpts?.kid ??
    (typeof opts.didOpts?.identifierOpts.identifier === 'object'
      ? (opts.didOpts?.identifierOpts.identifier as IIdentifier).keys[0].kid
      : !!opts.didOpts?.identifierOpts.kid
      ? opts.didOpts?.identifierOpts.kid
      : undefined)
  if (!keyRef) {
    throw Error('Key ref is needed for access token signer')
  }
  const signer = (data: string | Uint8Array) => {
    let dataString, encoding: 'base64' | undefined
    if (typeof data === 'string') {
      dataString = data
      encoding = undefined
    } else {
      ;(dataString = bytesToBase64(data)), (encoding = 'base64')
    }
    return context.agent.keyManagerSign({ keyRef, data: dataString, encoding })
  }
  async function accessTokenSignerCallback(jwt: Jwt, kid?: string): Promise<string> {
    const issuer = opts?.iss ?? opts.didOpts?.identifierOpts?.identifier.toString()
    if (!issuer) {
      throw Error('No issuer configured for access tokens')
    }
    const result = await createJWT(jwt.payload, { signer, issuer }, { ...jwt.header, typ: 'JWT' })
    return result
  }
  return accessTokenSignerCallback
}

export function getCredentialSignerCallback(didOpts: IDIDOptions, context: IRequiredContext) {
  async function issueVCCallback({
    credential,
    credentialRequest,
    format,
  }: {
    credentialRequest: UniformCredentialRequest
    credential: ICredential
    format?: OID4VCICredentialFormat
  }): Promise<W3CVerifiableCredential> {
    let proofFormat: ProofFormat

    proofFormat = format?.includes('ld') ? 'lds' : 'jwt'
    const result = await context.agent.createVerifiableCredential({
      credential: credential as CredentialPayload,
      proofFormat,
      fetchRemoteContexts: true,
      domain: getDID(didOpts.identifierOpts),
    })
    return result as W3CVerifiableCredential
  }

  return issueVCCallback
}

export async function createVciIssuerBuilder(
  args: {
    issuerOpts: IIssuerOptions
    metadata: CredentialIssuerMetadata
    credentialDataSupplier?: CredentialDataSupplier
  },
  context: IRequiredContext
): Promise<VcIssuerBuilder> {
  const { issuerOpts, metadata } = args
  const { didOpts } = issuerOpts
  const builder = new VcIssuerBuilder()
  builder.withIssuerMetadata(metadata)
  builder.withUserPinRequired(issuerOpts.userPinRequired ?? false)
  builder.withCredentialSignerCallback(getCredentialSignerCallback(didOpts, context))
  builder.withJWTVerifyCallback(getJwtVerifyCallback({}, context))
  if (args.credentialDataSupplier) {
    builder.withCredentialDataSupplier(args.credentialDataSupplier)
  }
  builder.withInMemoryCNonceState()
  builder.withInMemoryCredentialOfferState()
  builder.withInMemoryCredentialOfferURIState()

  return builder
}

export async function createVciIssuer(
  {
    issuerOpts,
    metadata,
    credentialDataSupplier,
  }: {
    issuerOpts: IIssuerOptions
    metadata: CredentialIssuerMetadata
    credentialDataSupplier?: CredentialDataSupplier
  },
  context: IRequiredContext
): Promise<VcIssuer> {
  return (await createVciIssuerBuilder({ issuerOpts, metadata, credentialDataSupplier }, context)).build()
}
