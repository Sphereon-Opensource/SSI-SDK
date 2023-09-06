import { CredentialRequestJwtVc } from '@sphereon/oid4vci-common'
import { CredentialDataSupplier, CredentialDataSupplierArgs, CredentialDataSupplierResult } from '@sphereon/oid4vci-issuer'
import { ExpressBuilder } from '@sphereon/ssi-express-support'
import { TAgent } from '@veramo/core'
import { IOID4VCIRestAPIOpts, IPlugins, OID4VCIRestAPI } from '../src'
import agent, { baseUrl } from './agent'

export const opts: IOID4VCIRestAPIOpts = {
  serverOpts: {
    host: '0.0.0.0',
    port: 5000,
  },
}

export function start() {
  const expressSupport = ExpressBuilder.fromServerOpts({
    port: 5000,
    hostname: '0.0.0.0',
  }).build()

  OID4VCIRestAPI.init({
    context: { ...agent.context, agent: agent as TAgent<IPlugins> },
    credentialDataSupplier: credentialDataSupplierSphereon,
    expressSupport,
    opts,
    issuerInstanceArgs: { credentialIssuer: `${baseUrl}/sphereon` },
  }).then((restApi) => {
    console.log('REST API STARTED: ' + restApi.instance.metadataOptions.credentialIssuer)
  })

  OID4VCIRestAPI.init({
    context: { ...agent.context, agent: agent as TAgent<IPlugins> },
    credentialDataSupplier: credentialDataSupplierDBCConference2023,
    expressSupport,
    opts,
    issuerInstanceArgs: { credentialIssuer: `${baseUrl}/dbc2023` },
  }).then((restApi) => {
    console.log('REST API STARTED: ' + restApi.instance.metadataOptions.credentialIssuer)
  })

  OID4VCIRestAPI.init({
    context: { ...agent.context, agent: agent as TAgent<IPlugins> },
    credentialDataSupplier: credentialDataSupplierFMAGuest2023,
    expressSupport,
    opts,
    issuerInstanceArgs: { credentialIssuer: `${baseUrl}/fma2023` },
  }).then((restApi) => {
    console.log('REST API STARTED: ' + restApi.instance.metadataOptions.credentialIssuer)
  })

  OID4VCIRestAPI.init({
    context: { ...agent.context, agent: agent as TAgent<IPlugins> },
    credentialDataSupplier: credentialDataSupplierTriallGuest2023,
    expressSupport,
    opts,
    issuerInstanceArgs: { credentialIssuer: `${baseUrl}/triall2023` },
  }).then((restApi) => {
    console.log('REST API STARTED: ' + restApi.instance.metadataOptions.credentialIssuer)
  })

  expressSupport.start()
}

const credentialDataSupplierDBCConference2023: CredentialDataSupplier = (args: CredentialDataSupplierArgs) => {
  const firstName = args.credentialDataSupplierInput?.firstName ?? 'Hello'
  const lastName = args.credentialDataSupplierInput?.lastName ?? 'DBC'
  const email = args.credentialDataSupplierInput?.email ?? 'dbc@example.com'

  return Promise.resolve({
    format: 'jwt_vc_json',
    credential: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'DBCConferenceAttendee'],
      expirationDate: '2023-07-26T00:00:00Z',
      credentialSubject: {
        firstName,
        lastName,
        email,
        event: {
          name: 'DBC Conference 2023',
          date: '2023-06-26',
        },
      },
    },
  } as unknown as CredentialDataSupplierResult)
}

const credentialDataSupplierFMAGuest2023: CredentialDataSupplier = (args: CredentialDataSupplierArgs) => {
  const firstName = args.credentialDataSupplierInput?.firstName ?? 'Hello'
  const lastName = args.credentialDataSupplierInput?.lastName ?? 'FMA'
  const email = args.credentialDataSupplierInput?.email ?? 'fma@example.com'

  return Promise.resolve({
    format: 'jwt_vc_json',
    credential: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'GuestCredential'],
      expirationDate: new Date(+new Date() + 24 * 60 * 60 * 3600).toISOString(),
      credentialSubject: {
        firstName,
        lastName,
        email,
        type: 'Future Mobility Alliance Guest',
      },
    },
  } as unknown as CredentialDataSupplierResult)
}

const credentialDataSupplierTriallGuest2023: CredentialDataSupplier = (args: CredentialDataSupplierArgs) => {
  const firstName = args.credentialDataSupplierInput?.firstName ?? 'Hello'
  const lastName = args.credentialDataSupplierInput?.lastName ?? 'Triall'
  const email = args.credentialDataSupplierInput?.email ?? 'triall@example.com'

  return Promise.resolve({
    format: 'jwt_vc_json',
    credential: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'GuestCredential'],
      expirationDate: new Date(+new Date() + 24 * 60 * 60 * 3600).toISOString(),
      credentialSubject: {
        firstName,
        lastName,
        email,
        type: 'Triall Guest',
      },
    },
  } as unknown as CredentialDataSupplierResult)
}

const credentialDataSupplierSphereon: CredentialDataSupplier = (args: CredentialDataSupplierArgs) => {
  const firstName = args.credentialDataSupplierInput?.firstName ?? 'Hello'
  const lastName = args.credentialDataSupplierInput?.lastName ?? 'Sphereon'
  const email = args.credentialDataSupplierInput?.email ?? 'sphereon@example.com'

  if (args.credentialRequest.format !== 'jwt_vc_json') {
    throw Error(`Format ${args.credentialRequest.format} is not configured on this issuer`)
  }

  const request = args.credentialRequest as CredentialRequestJwtVc
  if (request.types.includes('VerifiedEmployee')) {
    return Promise.resolve({
      format: 'jwt_vc_json',
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'VerifiedEmployee'],
        expirationDate: new Date(+new Date() + 48 * 60 * 60 * 3600).toISOString(),
        credentialSubject: {
          givenName: firstName,
          surname: lastName,
          mail: email,
          displayName: `${firstName} ${lastName}`,
          jobTitle: 'Chief Credential Issuer',
          preferredLanguage: 'en_US',
        },
      },
    } as unknown as CredentialDataSupplierResult)
  } else if (request.types.includes('MembershipExample')) {
    return Promise.resolve({
      format: 'jwt_vc_json',
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'MembershipExample'],
        expirationDate: new Date(+new Date() + 48 * 60 * 60 * 3600).toISOString(),
        credentialSubject: {
          firstName,
          lastName,
          email,
          type: 'Membership Example',
        },
      },
    } as unknown as CredentialDataSupplierResult)
  }
  throw Error(`${JSON.stringify(request.types)} not supported by this issuer`)
}
